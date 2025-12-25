from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from uuid import UUID

import httpx
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.capabilities import build_generation_capabilities
from app.core.errors import GeneratorConfigurationError, UnsupportedImageSizeError, UnsupportedSourceImagesError
from app.core.image_optimization import OptimizationSettings, optimize_image
from app.core.image_generators.base import ImageGenerator
from app.core.jobs_repository import mark_completed, mark_failed, mark_processing
from app.core.settings import Settings
from app.core.storage.base import Storage

logger = logging.getLogger(__name__)


class GenerationWorker:
    def __init__(
        self,
        *,
        settings: Settings,
        redis_client: redis.Redis,
        db_sessionmaker: async_sessionmaker[AsyncSession],
        generator: ImageGenerator,
        storage: Storage,
    ) -> None:
        self._settings = settings
        self._redis = redis_client
        self._db_sessionmaker = db_sessionmaker
        self._generator = generator
        self._storage = storage

    async def run(self) -> None:
        while True:
            item = await self._redis.blpop(
                self._settings.queue_key,
                timeout=self._settings.worker_poll_timeout_s,
            )
            if item is None:
                await asyncio.sleep(0)
                continue
            _, raw_job_id = item
            try:
                job_id = UUID(raw_job_id.decode("utf-8"))
            except Exception:
                continue
            await self._process_one(job_id)

    async def _process_one(self, job_id: UUID) -> None:
        async with self._db_sessionmaker() as db:
            try:
                await mark_processing(db, job_id, progress=10)

                from app.core.jobs_repository import get_job  # local import to keep dependencies narrow

                job = await get_job(db, job_id)

                input_path = Path(self._settings.media_root) / "inputs" / str(job_id)

                def _read_source_images() -> list[bytes] | None:
                    try:
                        if input_path.is_file():
                            return [input_path.read_bytes()]
                        if input_path.is_dir():
                            files = sorted([p for p in input_path.iterdir() if p.is_file()], key=lambda p: p.name)
                            if not files:
                                return None
                            return [p.read_bytes() for p in files]
                        return None
                    except Exception:
                        return None

                source_images = await asyncio.to_thread(_read_source_images)

                generated = await self._generator.generate(
                    prompt=job.prompt,
                    width=job.width,
                    height=job.height,
                    seed=job.seed,
                    source_images=source_images,
                )
                await mark_processing(db, job_id, progress=85)

                generated = optimize_image(
                    generated,
                    OptimizationSettings(
                        enabled=self._settings.output_enabled,
                        output_format=self._settings.output_format,
                        quality=self._settings.output_quality,
                        max_side=self._settings.output_max_side,
                    ),
                )

                file_name = await self._storage.save_image(
                    job_id=job_id,
                    content=generated.content,
                    mime_type=generated.mime_type,
                )
                await mark_completed(db, job_id=job_id, file_name=file_name, mime_type=generated.mime_type)
            except Exception as exc:  # noqa: BLE001
                logger.exception("Задача генерации завершилась ошибкой (job_id=%s)", job_id)
                user_message = _user_facing_error(exc, settings=self._settings)
                try:
                    await mark_failed(db, job_id=job_id, error_message=user_message)
                except Exception:
                    return


def _user_facing_error(exc: Exception, *, settings: Settings) -> str:
    if isinstance(exc, GeneratorConfigurationError):
        return "Сервис генерации сейчас не настроен. Попробуйте позже."
    if isinstance(exc, UnsupportedImageSizeError):
        allowed = None
        try:
            caps = build_generation_capabilities(settings=settings)
            dims = [f"{p.width}x{p.height}" for p in caps.size_presets]
            allowed = ", ".join(dims) if dims else None
        except Exception:
            allowed = None
        return (
            f"Размер {exc.width}x{exc.height} пока не поддерживается. "
            f"Разрешено: {allowed or 'попробуйте другой размер.'}"
        )
    if isinstance(exc, UnsupportedSourceImagesError):
        return (
            f"Модель {exc.model} не умеет работать с исходными фото. "
            "Уберите фото или выберите модель, которая это поддерживает (например, dall-e-2)."
        )
    if isinstance(exc, TimeoutError):
        return "Сервис генерации отвечает слишком долго. Попробуйте позже."
    if isinstance(exc, httpx.TimeoutException):
        return "Сервис генерации отвечает слишком долго. Попробуйте позже."
    if isinstance(exc, httpx.HTTPError):
        return "Сервис генерации временно недоступен. Попробуйте позже."

    openai_error_type = None
    auth_error_type = None
    permission_error_type = None
    not_found_error_type = None
    bad_request_error_type = None
    rate_limit_error_type = None
    api_connection_error_type = None
    api_timeout_error_type = None
    try:
        from openai import (
            APIConnectionError as _APIConnectionError,
            APITimeoutError as _APITimeoutError,
            AuthenticationError as _AuthenticationError,
            BadRequestError as _BadRequestError,
            NotFoundError as _NotFoundError,
            OpenAIError as _OpenAIError,
            PermissionDeniedError as _PermissionDeniedError,
            RateLimitError as _RateLimitError,
        )

        openai_error_type = _OpenAIError
        auth_error_type = _AuthenticationError
        permission_error_type = _PermissionDeniedError
        not_found_error_type = _NotFoundError
        bad_request_error_type = _BadRequestError
        rate_limit_error_type = _RateLimitError
        api_connection_error_type = _APIConnectionError
        api_timeout_error_type = _APITimeoutError
    except Exception:
        openai_error_type = None

    if openai_error_type is not None and isinstance(exc, openai_error_type):
        msg = getattr(exc, "message", "") or str(exc)
        code = getattr(exc, "code", None)
        body = getattr(exc, "body", None)
        if isinstance(body, dict):
            err = body.get("error")
            if isinstance(err, dict):
                code_val = err.get("code")
                if isinstance(code_val, str) and code_val:
                    code = code_val
                msg_val = err.get("message")
                if isinstance(msg_val, str) and msg_val:
                    msg = msg_val

        low = msg.lower()
        if isinstance(code, str) and code:
            low = f"{code.lower()} {low}"

        if auth_error_type is not None and isinstance(exc, auth_error_type):
            return "Сервис изображений OpenAI сейчас недоступен."
        if "unsupported_country_region_territory" in low or "unsupported country" in low:
            return "Сервис изображений OpenAI недоступен в вашем регионе."
        if "insufficient_quota" in low or "quota" in low or "billing" in low:
            return "Сервис изображений OpenAI временно недоступен из‑за ограничений учётной записи."
        if permission_error_type is not None and isinstance(exc, permission_error_type):
            return "Нет доступа к сервису изображений OpenAI."
        if not_found_error_type is not None and isinstance(exc, not_found_error_type):
            return "Выбранная модель OpenAI не найдена."
        if rate_limit_error_type is not None and isinstance(exc, rate_limit_error_type):
            return "Слишком много запросов. Попробуйте позже."
        if api_timeout_error_type is not None and isinstance(exc, api_timeout_error_type):
            return "OpenAI отвечает слишком долго. Попробуйте позже."
        if api_connection_error_type is not None and isinstance(exc, api_connection_error_type):
            return "Не удалось подключиться к OpenAI. Попробуйте позже."
        if bad_request_error_type is not None and isinstance(exc, bad_request_error_type):
            return "Не удалось создать изображение из‑за настроек запроса. Попробуйте другой стиль или размер."

        return "Ошибка сервиса изображений OpenAI. Попробуйте позже."

    client_error_type = None
    try:
        from google.genai.errors import ClientError as _ClientError

        client_error_type = _ClientError
    except Exception:
        client_error_type = None
    if client_error_type is not None and isinstance(exc, client_error_type):
        msg = getattr(exc, "message", "") or str(exc)
        low = msg.lower()
        if "api_key_invalid" in low or "api key not valid" in low:
            return "Сервис Gemini сейчас недоступен."
        if "model_not_found" in low or "model not found" in low:
            return "Выбранная модель Gemini не найдена."
        if "imagen api is only accessible to billed users" in low or "billed users" in low:
            return (
                "Imagen доступен только для аккаунтов с включённым биллингом. "
                "Подключите оплату для Gemini API или выберите другую модель."
            )
        if "quota" in low or "billing" in low or "billed" in low or "limit:" in low:
            return "Сервис Gemini временно недоступен из‑за ограничений учётной записи."
        if "unsupported" in low or "not supported" in low:
            return "Сервис Gemini недоступен в вашем регионе."
        return "Ошибка сервиса Gemini. Попробуйте позже."
    return "Не удалось сгенерировать изображение. Попробуйте позже."
