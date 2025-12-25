from __future__ import annotations

from nanovisual_shared.schemas import GenerationCapabilities, ImageSizePreset

from app.core.settings import Settings

MAX_PHOTOS = 4


def _is_dalle2(model: str) -> bool:
    return model.strip().lower() == "dall-e-2"


def _is_dalle3(model: str) -> bool:
    return model.strip().lower() == "dall-e-3"


def _is_imagen_model(model: str) -> bool:
    value = model.strip().lower()
    if value.startswith("models/"):
        value = value.removeprefix("models/")
    return value.startswith("imagen-")


def _is_imagen_fast_model(model: str) -> bool:
    value = model.strip().lower()
    if value.startswith("models/"):
        value = value.removeprefix("models/")
    return value.startswith("imagen-") and "-fast-" in value


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


def _openai_presets(model: str) -> list[ImageSizePreset]:
    if _is_dalle2(model):
        return [
            _preset(1024, 1024, label="Квадрат • 1024×1024"),
            _preset(512, 512, label="Квадрат • 512×512"),
            _preset(256, 256, label="Квадрат • 256×256"),
        ]
    if _is_dalle3(model):
        return [
            _preset(1024, 1024, label="Квадрат • 1024×1024"),
            _preset(1792, 1024, label="Пейзаж • 1792×1024"),
            _preset(1024, 1792, label="Портрет • 1024×1792"),
        ]
    return [
        _preset(1024, 1024, label="Квадрат • 1024×1024"),
        _preset(1536, 1024, label="Пейзаж • 1536×1024"),
        _preset(1024, 1536, label="Портрет • 1024×1536"),
    ]


def _gemini_presets(model: str) -> list[ImageSizePreset]:
    presets_1k = [
        _preset(1024, 1024, label="Квадрат • 1K", aspect_ratio="1:1", quality="1K"),
        _preset(1024, 576, label="Пейзаж • 16:9 • 1K", aspect_ratio="16:9", quality="1K"),
        _preset(576, 1024, label="Портрет • 9:16 • 1K", aspect_ratio="9:16", quality="1K"),
    ]
    if _is_imagen_fast_model(model):
        return presets_1k

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
    provider = settings.image_provider

    if provider == "openai":
        model = settings.openai_model
        return GenerationCapabilities(
            image_provider=provider,
            model=model,
            supports_source_images=_is_dalle2(model),
            max_photos=MAX_PHOTOS,
            size_presets=_openai_presets(model),
        )

    if provider == "gemini":
        model = settings.gemini_model
        return GenerationCapabilities(
            image_provider=provider,
            model=model,
            supports_source_images=not _is_imagen_model(model),
            max_photos=MAX_PHOTOS,
            size_presets=_gemini_presets(model),
        )

    return GenerationCapabilities(
        image_provider="mock",
        model="mock",
        supports_source_images=True,
        max_photos=MAX_PHOTOS,
        size_presets=_openai_presets("gpt-image-1"),
    )
