from __future__ import annotations

import base64
import logging
import re

import httpx
from openai import AsyncOpenAI

from app.core.errors import GeneratorConfigurationError
from app.core.image_generators.base import GeneratedImage
from app.core.settings import Settings

logger = logging.getLogger(__name__)

def _map_params_to_openrouter_config(width: int, height: int) -> dict:
    ratio = width / height
    if 0.9 <= ratio <= 1.1:
        ar = "1:1"
    elif ratio > 1.7:
        ar = "16:9"
    elif ratio > 1.3:
        ar = "4:3"
    elif ratio < 0.6:
        ar = "9:16"
    else:
        ar = "3:4"

    return {
        "aspect_ratio": ar,
    }

class OpenRouterImageGenerator:
    def __init__(self, *, settings: Settings) -> None:
        self._settings = settings
        
        if not self._settings.openrouter_api_key:
            raise GeneratorConfigurationError("Не задан GEN_SERVICE_OPENROUTER_API_KEY")

        self._client = AsyncOpenAI(
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

        image_config = _map_params_to_openrouter_config(width, height)
        model = self._settings.openrouter_model

        if source_images:
            content: list[dict] = [{"type": "text", "text": prompt}]
            for img_bytes in source_images:
                b64_img = base64.b64encode(img_bytes).decode("utf-8")
                mime = "image/png"
                if img_bytes.startswith(b'\xff\xd8'):
                    mime = "image/jpeg"
                elif img_bytes.startswith(b'RIFF') and b'WEBP' in img_bytes[:16]:
                    mime = "image/webp"
                
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime};base64,{b64_img}"
                    }
                })
            messages = [{"role": "user", "content": content}]
        else:
            messages = [{"role": "user", "content": prompt}]

        kwargs = {
            "model": model,
            "messages": messages,
            "extra_body": {
                "modalities":["image", "text"],
                "image_config": image_config,
            }
        }
        
        if seed is not None:
            kwargs["seed"] = seed

        try:
            response = await self._client.chat.completions.create(**kwargs)
        except Exception as exc:
            logger.error(f"OpenRouter generation failed: {exc}")
            raise

        choice = response.choices[0]
        message = choice.message
        
        # 1. Сценарий: OpenRouter добавил массив `images` (Pydantic переносит неизвестные поля SDK в model_extra)
        images = None
        if hasattr(message, "model_extra") and message.model_extra:
            images = message.model_extra.get("images")
            
        if isinstance(images, list) and len(images) > 0:
            for img_obj in images:
                url_obj = img_obj.get("imageUrl") or img_obj.get("image_url") or img_obj
                img_url = url_obj.get("url") if isinstance(url_obj, dict) else url_obj
                
                if isinstance(img_url, str):
                    if img_url.startswith("data:image/"):
                        header, b64_data = img_url.split(",", 1)
                        mime_type = header.split(";")[0].replace("data:", "")
                        image_bytes = base64.b64decode(b64_data)
                        return GeneratedImage(content=image_bytes, mime_type=mime_type)
                    elif img_url.startswith("http"):
                        async with httpx.AsyncClient(timeout=60.0) as http:
                            r = await http.get(img_url)
                            r.raise_for_status()
                            mime = r.headers.get("content-type", "image/png")
                            return GeneratedImage(content=r.content, mime_type=mime)

        content = message.content or ""

        # 2. Сценарий: Изображение отдано в виде Markdown Data-URL 
        # Регулярное выражение захватит только корректные Base64-символы.
        match = re.search(r'data:image/(\w+);base64,([a-zA-Z0-9+/=]+)', content)
        if match:
            fmt = match.group(1)
            b64_data = match.group(2)
            mime_type = f"image/{fmt}"
            image_bytes = base64.b64decode(b64_data)
            return GeneratedImage(content=image_bytes, mime_type=mime_type)

        # 3. Сценарий: Обычная ссылка на изображение в тексте
        url_match = re.search(r'(https?://[^\s)\]"\']+)', content)
        if url_match:
            image_url = url_match.group(1)
            if any(ext in image_url.lower() for ext in ['.png', '.jpg', '.jpeg', '.webp', 'googleusercontent']):
                async with httpx.AsyncClient(timeout=60.0) as http:
                    r = await http.get(image_url)
                    r.raise_for_status()
                    mime = r.headers.get("content-type", "image/png")
                    return GeneratedImage(content=r.content, mime_type=mime)

        # Если не найдено ничего (например Gemini ответил: "Я не могу сгенерировать..."), логгируем причину.
        logger.error(
            f"Could not find image in response.\n"
            f"model_extra: {getattr(message, 'model_extra', None)}\n"
            f"Content preview: {content[:1000]}"
        )
        raise RuntimeError(f"OpenRouter response did not contain a valid image data URL. Answer: {content[:200]}")
