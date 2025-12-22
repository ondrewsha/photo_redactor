from __future__ import annotations

import base64
import inspect
import logging
import socket
from typing import Literal
from urllib.parse import urlparse

import httpx

from app.core.errors import GeneratorConfigurationError, UnsupportedImageSizeError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings

logger = logging.getLogger(__name__)

_OpenAISize = Literal[
    "256x256",
    "512x512",
    "1024x1024",
    "1536x1024",
    "1024x1536",
    "1792x1024",
    "1024x1792",
]


def _redact_proxy_url(proxy_url: str) -> str:
    parsed = urlparse(proxy_url)
    if parsed.username or parsed.password:
        host = parsed.hostname or ""
        if parsed.port is not None:
            host = f"{host}:{parsed.port}"
        return parsed._replace(netloc=host).geturl()
    return proxy_url


def _is_proxy_reachable(proxy_url: str, *, timeout_s: float = 1.5) -> bool:
    parsed = urlparse(proxy_url)
    host = parsed.hostname
    if not host:
        return False
    port = parsed.port
    if port is None:
        port = 443 if parsed.scheme == "https" else 80
    try:
        with socket.create_connection((host, port), timeout=timeout_s):
            return True
    except OSError:
        return False


def _map_size(width: int, height: int) -> _OpenAISize:
    mapping: dict[tuple[int, int], _OpenAISize] = {
        (256, 256): "256x256",
        (512, 512): "512x512",
        (1024, 1024): "1024x1024",
        (1536, 1024): "1536x1024",
        (1024, 1536): "1024x1536",
        (1792, 1024): "1792x1024",
        (1024, 1792): "1024x1792",
    }
    size = mapping.get((width, height))
    if size is None:
        raise UnsupportedImageSizeError(width=width, height=height)
    return size


def _mime_from_format(fmt: str) -> str:
    if fmt == "png":
        return "image/png"
    if fmt == "jpeg":
        return "image/jpeg"
    if fmt == "webp":
        return "image/webp"
    return "application/octet-stream"


def _detect_mime(data: bytes) -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8"):
        return "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"


class OpenAIImageGenerator:
    def __init__(self, *, settings: Settings) -> None:
        self._settings = settings
        try:
            from openai import AsyncOpenAI
        except Exception as exc:  # noqa: BLE001
            raise GeneratorConfigurationError(
                "Не установлена библиотека openai. Добавьте зависимость `openai` и пересоберите generation_service."
            ) from exc

        if not self._settings.openai_api_key:
            raise GeneratorConfigurationError(
                "Set GEN_SERVICE_OPENAI_API_KEY for image_provider=openai"
            )

        proxy = self._settings.openai_proxy_url or None
        if proxy and not _is_proxy_reachable(proxy):
            logger.warning("OpenAI proxy is not reachable, disabling proxy: %s", _redact_proxy_url(proxy))
            proxy = None

        timeout = httpx.Timeout(
            connect=min(5.0, self._settings.http_timeout_s),
            read=self._settings.http_timeout_s,
            write=self._settings.http_timeout_s,
            pool=self._settings.http_timeout_s,
        )
        self._http = httpx.AsyncClient(timeout=timeout, proxy=proxy)
        self._client = AsyncOpenAI(
            api_key=self._settings.openai_api_key,
            base_url=self._settings.openai_base_url,
            http_client=self._http,
            max_retries=0,
            timeout=self._settings.http_timeout_s,
        )
        try:
            self._generate_signature = inspect.signature(self._client.images.generate)
        except Exception:  # noqa: BLE001
            self._generate_signature = None

    async def close(self) -> None:
        await self._http.aclose()

    async def generate(self, *, prompt: str, width: int, height: int, seed: int | None) -> GeneratedImage:
        _ = seed
        size = _map_size(width, height)

        kwargs: dict[str, object] = {}
        if self._settings.openai_style is not None:
            kwargs["style"] = self._settings.openai_style

        call_kwargs: dict[str, object] = {
            "model": self._settings.openai_model,
            "prompt": prompt,
            "size": size,
            "response_format": "b64_json",
            "output_format": self._settings.openai_output_format,
            "quality": self._settings.openai_quality,
            **kwargs,
        }
        if self._generate_signature is not None:
            allowed = set(self._generate_signature.parameters.keys())
            call_kwargs = {k: v for k, v in call_kwargs.items() if k in allowed}
        try:
            response = await self._client.images.generate(**call_kwargs)
        except TypeError:
            response = await self._client.images.generate(
                model=self._settings.openai_model,
                prompt=prompt,
                size=size,
                response_format="b64_json",
            )

        if not response.data:
            raise RuntimeError("OpenAI images response missing data")
        image = response.data[0]
        image_b64 = getattr(image, "b64_json", None)
        if image_b64:
            content = base64.b64decode(image_b64)
            mime = _detect_mime(content)
            if mime == "application/octet-stream":
                mime = _mime_from_format(self._settings.openai_output_format)
            return GeneratedImage(
                content=content,
                mime_type=mime,
            )

        image_url = getattr(image, "url", None)
        if isinstance(image_url, str) and image_url:
            resp = await self._http.get(image_url)
            resp.raise_for_status()
            content = resp.content
            mime = resp.headers.get("content-type") or _detect_mime(content)
            return GeneratedImage(content=content, mime_type=mime)

        raise RuntimeError("OpenAI images response missing image content")
