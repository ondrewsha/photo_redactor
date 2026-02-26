from __future__ import annotations

from nanovisual_shared.schemas import GenerationCapabilities, ImageSizePreset

from app.core.settings import Settings

MAX_PHOTOS = 4

def _preset(
    width: int,
    height: int,
    *,
    label: str,
    aspect_ratio: str | None = None,
    quality: str | None = None,
) -> ImageSizePreset:
    return ImageSizePreset(
        id=f"{width}x{height}",
        label=label,
        width=width,
        height=height,
        aspect_ratio=aspect_ratio,
        quality=quality,
    )

def _gemini_pro_presets() -> list[ImageSizePreset]:
    presets_1k = [
        _preset(1024, 1024, label="Квадрат • 1K", aspect_ratio="1:1", quality="1K"),
        _preset(1024, 576, label="Пейзаж • 16:9 • 1K", aspect_ratio="16:9", quality="1K"),
        _preset(576, 1024, label="Портрет • 9:16 • 1K", aspect_ratio="9:16", quality="1K"),
    ]
    presets_2k = [
        _preset(2048, 2048, label="Квадрат • 2K", aspect_ratio="1:1", quality="2K"),
        _preset(2048, 1152, label="Пейзаж • 16:9 • 2K", aspect_ratio="16:9", quality="2K"),
        _preset(1152, 2048, label="Портрет • 9:16 • 2K", aspect_ratio="9:16", quality="2K"),
    ]
    presets_4k = [
        _preset(4096, 4096, label="Квадрат • 4K", aspect_ratio="1:1", quality="4K"),
        _preset(4096, 2304, label="Пейзаж • 16:9 • 4K", aspect_ratio="16:9", quality="4K"),
        _preset(2304, 4096, label="Портрет • 9:16 • 4K", aspect_ratio="9:16", quality="4K"),
    ]
    return [*presets_1k, *presets_2k, *presets_4k]

def build_generation_capabilities(*, settings: Settings) -> GenerationCapabilities:
    if settings.image_provider == "mock":
        return GenerationCapabilities(
            image_provider="mock",
            model="mock",
            supports_source_images=True,
            max_photos=MAX_PHOTOS,
            size_presets=[_preset(1024, 1024, label="Mock 1024")],
        )
    
    if settings.image_provider == "openrouter":
        return GenerationCapabilities(
            image_provider="gemini",
            model=settings.openrouter_model,
            supports_source_images=True,
            max_photos=4,
            size_presets=_gemini_pro_presets(),
        )
