from __future__ import annotations

import base64
import logging
import re

from openai import OpenAI

from app.core.errors import GeneratorConfigurationError, UnsupportedSourceImagesError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings

logger = logging.getLogger(__name__)

# Маппинг размеров в формат OpenRouter/Gemini
# Gemini на OpenRouter принимает "1K", "2K" или "4K" в поле image_size (опционально)
# и aspect_ratio (строкой).
def _map_params_to_openrouter_config(width: int, height: int) -> dict:
    # 1. Определяем Aspect Ratio
    ratio = width / height
    if 0.9 <= ratio <= 1.1:
        ar = "1:1"
    elif ratio > 1.7:
        ar = "16:9"
    elif ratio > 1.3:
        ar = "4:3" # или 3:2
    elif ratio < 0.6:
        ar = "9:16"
    else:
        ar = "3:4" # или 2:3

    # 2. Определяем размер (приблизительно)
    # Gemini 3 Pro поддерживает 2K/4K
    max_side = max(width, height)
    if max_side > 2048:
        size_label = "4K" # или "raw"
    elif max_side > 1024:
        size_label = "2K" # HD
    else:
        size_label = "1K" # standard

    return {
        "aspect_ratio": ar,
        # Некоторые версии API игнорируют image_size или требуют его отсутствие для 1K
        # Но для Gemini 3 Pro Image Preview лучше передать, если хотим качество.
        # "image_size": size_label 
    }

class OpenRouterImageGenerator:
    def __init__(self, *, settings: Settings) -> None:
        self._settings = settings
        
        if not self._settings.openrouter_api_key:
            raise GeneratorConfigurationError("Не задан GEN_SERVICE_OPENROUTER_API_KEY")

        self._client = OpenAI(
            api_key=self._settings.openrouter_api_key,
            base_url=self._settings.openrouter_base_url,
            timeout=self._settings.http_timeout_s,
        )

    async def close(self) -> None:
        await self._client.close()

    async def generate(
        self,
        *,
        prompt: str,
        width: int,
        height: int,
        seed: int | None,
        source_images: list[bytes] | None = None,
    ) -> GeneratedImage:
        # Gemini 3 Pro Image Preview через OpenRouter обычно работает в режиме Text-to-Image
        if source_images:
            raise UnsupportedSourceImagesError(model=self._settings.openrouter_model)

        image_config = _map_params_to_openrouter_config(width, height)
        model = self._settings.openrouter_model

        try:
            # Для Gemini на OpenRouter нужно использовать Chat Completions API
            # С передачей modalities=["image"] и prompt в messages
            response = await self._client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                # Важно: OpenRouter требует эти параметры в теле запроса
                extra_body={
                    "modalities": ["image"],  # Указываем, что хотим картинку
                    "image_config": image_config, # Настройки размера
                    # "transforms": ["uptown"] # Можно добавить улучшения, если поддерживается
                }
            )
        except Exception as exc:
            logger.error(f"OpenRouter generation failed: {exc}")
            raise

        choice = response.choices[0]
        message = choice.message
        
        # OpenRouter возвращает картинку внутри message.content или как url в content
        # Обычно это markdown-подобная ссылка или data-url.
        # Для multimodal моделей часто приходит Markdown image: ![image](data:image/png;base64,...)
        
        content = message.content or ""
        
        # 1. Проверяем наличие Data URL в тексте
        # Ищем паттерн data:image/...;base64,
        match = re.search(r'data:image/(\w+);base64,([^"\')\s]+)', content)
        if match:
            fmt = match.group(1)
            b64_data = match.group(2)
            mime_type = f"image/{fmt}"
            image_bytes = base64.b64decode(b64_data)
            return GeneratedImage(content=image_bytes, mime_type=mime_type)

        # 2. Если OpenRouter вернул просто URL (редко для этой модели, но возможно)
        url_match = re.search(r'(https?://[^\s)]+)', content)
        if url_match:
            import httpx
            image_url = url_match.group(1)
            # Проверяем, что это ссылка на картинку, а не просто ссылка на доку
            if any(ext in image_url.lower() for ext in ['.png', '.jpg', '.webp', 'googleusercontent']):
                async with httpx.AsyncClient() as http:
                    r = await http.get(image_url)
                    r.raise_for_status()
                    mime = r.headers.get("content-type", "image/png")
                    return GeneratedImage(content=r.content, mime_type=mime)

        logger.error(f"Could not find image in response: {content[:200]}...")
        raise RuntimeError("OpenRouter response did not contain a valid image data URL")