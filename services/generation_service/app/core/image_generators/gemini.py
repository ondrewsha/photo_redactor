from __future__ import annotations

import base64
import asyncio
import io
from typing import Any

import httpx

from app.core.errors import GeneratorConfigurationError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings


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

        self._http_client = httpx.Client(
            timeout=self._settings.http_timeout_s,
            proxy=self._settings.gemini_proxy_url or None,
        )
        http_options = types.HttpOptions(httpx_client=self._http_client)

        self._client = genai.Client(
            api_key=self._settings.gemini_api_key,
            http_options=http_options,
        )

    def close(self) -> None:
        self._http_client.close()

    async def generate(self, *, prompt: str, width: int, height: int, seed: int | None) -> GeneratedImage:
        # Nano Banana models don't currently expose width/height/seed controls in SDK;
        # we keep them in our API contract for future providers and post-processing.
        _ = (width, height, seed)

        return await asyncio.wait_for(
            asyncio.to_thread(self._generate_sync, prompt),
            timeout=self._settings.http_timeout_s,
        )

    def _generate_sync(self, prompt: str) -> GeneratedImage:
        response = self._client.models.generate_content(
            model=self._settings.gemini_model,
            contents=prompt,
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
