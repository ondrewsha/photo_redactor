from __future__ import annotations

import base64

import httpx

from app.core.errors import GeneratorConfigurationError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings


class GeminiImageGenerator:
    def __init__(self, *, http: httpx.AsyncClient, settings: Settings) -> None:
        self._http = http
        self._settings = settings

    async def generate(self, *, prompt: str, width: int, height: int, seed: int | None) -> GeneratedImage:
        if not self._settings.gemini_api_key or self._settings.gemini_base_url == "https://example.invalid":
            raise GeneratorConfigurationError(
                "Set GEN_SERVICE_GEMINI_API_KEY and GEN_SERVICE_GEMINI_BASE_URL for image_provider=gemini"
            )

        url = f"{self._settings.gemini_base_url.rstrip('/')}/generate"
        headers = {
            "Authorization": f"Bearer {self._settings.gemini_api_key}",
            "Content-Type": "application/json",
        }
        payload: dict[str, object] = {
            "model": self._settings.gemini_model,
            "prompt": prompt,
            "width": width,
            "height": height,
            "seed": seed,
        }

        resp = await self._http.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        image_b64 = data.get("image_base64")
        mime_type = data.get("mime_type", "image/png")
        if not isinstance(image_b64, str):
            raise RuntimeError("Gemini response missing image_base64")
        if not isinstance(mime_type, str) or not mime_type:
            raise RuntimeError("Gemini response invalid mime_type")

        return GeneratedImage(content=base64.b64decode(image_b64), mime_type=mime_type)
