from __future__ import annotations

import base64
import asyncio
import io
import logging
import socket
from typing import Any
from urllib.parse import urlparse

import httpx

from app.core.errors import GeneratorConfigurationError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings

logger = logging.getLogger(__name__)


def _detect_mime(data: bytes) -> str:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8"):
        return "image/jpeg"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return "application/octet-stream"


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


class GeminiImageGenerator:
    def __init__(self, *, settings: Settings) -> None:
        self._settings = settings
        try:
            from google import genai
            from google.genai import types
        except Exception as exc:  # noqa: BLE001
            raise GeneratorConfigurationError(
                "Не установлена библиотека google-genai. Добавьте зависимость `google-genai` "
                "и пересоберите generation_service."
            ) from exc

        if not self._settings.gemini_api_key:
            raise GeneratorConfigurationError(
                "Set GEN_SERVICE_GEMINI_API_KEY for image_provider=gemini"
            )

        proxy = self._settings.gemini_proxy_url or None
        if proxy and not _is_proxy_reachable(proxy):
            logger.warning("Gemini proxy is not reachable, disabling proxy: %s", _redact_proxy_url(proxy))
            proxy = None

        timeout = httpx.Timeout(
            connect=min(5.0, self._settings.http_timeout_s),
            read=self._settings.http_timeout_s,
            write=self._settings.http_timeout_s,
            pool=self._settings.http_timeout_s,
        )
        self._http_client = httpx.Client(
            timeout=timeout,
            proxy=proxy,
        )
        http_options = types.HttpOptions(httpx_client=self._http_client)

        self._client = genai.Client(
            api_key=self._settings.gemini_api_key,
            http_options=http_options,
        )

    def close(self) -> None:
        self._http_client.close()

    async def generate(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        seed: int | None,
        source_images: list[bytes] | None = None,
    ) -> GeneratedImage:
        _ = (width, height, seed)

        return await asyncio.wait_for(
            asyncio.to_thread(self._generate_sync, prompt, source_images),
            timeout=self._settings.http_timeout_s,
        )

    def _generate_sync(self, prompt: str, source_images: list[bytes] | None) -> GeneratedImage:
        contents: Any = prompt
        if source_images:
            from google.genai import types

            contents = [
                types.Content(
                    role="user",
                    parts=[
                        *[
                            types.Part.from_bytes(
                                data=img,
                                mime_type=_detect_mime(img),
                            )
                            for img in source_images
                        ],
                        types.Part.from_text(text=prompt),
                    ],
                )
            ]

        response = self._client.models.generate_content(
            model=self._settings.gemini_model,
            contents=contents,
        )

        parts: Any = getattr(response, "parts", None)
        if not parts:
            candidates = getattr(response, "candidates", None)
            if candidates:
                content = getattr(candidates[0], "content", None)
                parts = getattr(content, "parts", None)

        for part in parts or []:
            inline_data = getattr(part, "inline_data", None)
            if not inline_data:
                continue
            data = getattr(inline_data, "data", None)
            mime_type = getattr(inline_data, "mime_type", None) or "image/png"
            content = _coerce_image_bytes(data, part)
            return GeneratedImage(content=content, mime_type=str(mime_type))

        raise RuntimeError("Gemini response missing inline image data")


def _coerce_image_bytes(data: object, part: object) -> bytes:
    if isinstance(data, (bytes, bytearray, memoryview)):
        return bytes(data)
    if isinstance(data, str):
        return base64.b64decode(data)

    as_image = getattr(part, "as_image", None)
    if callable(as_image):
        image = as_image()
        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return buf.getvalue()

    raise RuntimeError("Gemini inline_data.data is missing or unsupported")
