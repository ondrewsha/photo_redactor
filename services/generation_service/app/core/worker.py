from __future__ import annotations

import asyncio
from uuid import UUID

import httpx
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.errors import GeneratorConfigurationError
from app.core.image_optimization import OptimizationSettings, optimize_image
from app.core.image_generators.base import ImageGenerator
from app.core.jobs_repository import mark_completed, mark_failed, mark_processing
from app.core.settings import Settings
from app.core.storage.base import Storage


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

                generated = await self._generator.generate(
                    prompt=job.prompt,
                    width=job.width,
                    height=job.height,
                    seed=job.seed,
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
                user_message = _user_facing_error(exc)
                try:
                    await mark_failed(db, job_id=job_id, error_message=user_message)
                except Exception:
                    return


def _user_facing_error(exc: Exception) -> str:
    if isinstance(exc, GeneratorConfigurationError):
        return "Сервис генерации не настроен. Попробуйте позже."
    if isinstance(exc, TimeoutError):
        return "Сервис генерации отвечает слишком долго. Попробуйте позже."
    if isinstance(exc, httpx.TimeoutException):
        return "Сервис генерации отвечает слишком долго. Попробуйте позже."
    if isinstance(exc, httpx.HTTPError):
        return "Сервис генерации временно недоступен. Попробуйте позже."
    return "Не удалось сгенерировать изображение. Попробуйте позже."
