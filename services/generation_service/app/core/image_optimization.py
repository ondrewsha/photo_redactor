from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from typing import Literal

from app.core.image_generators.base import GeneratedImage

OutputFormat = Literal["webp", "png", "jpeg"]


@dataclass(frozen=True, slots=True)
class OptimizationSettings:
    enabled: bool
    output_format: OutputFormat
    quality: int
    max_side: int | None


_FORMAT_TO_MIME: dict[OutputFormat, str] = {
    "webp": "image/webp",
    "png": "image/png",
    "jpeg": "image/jpeg",
}


def optimize_image(generated: GeneratedImage, settings: OptimizationSettings) -> GeneratedImage:
    if not settings.enabled:
        return generated

    try:
        from PIL import Image
    except Exception:
        return generated

    try:
        with Image.open(BytesIO(generated.content)) as img:
            img.load()

            if settings.max_side and settings.max_side > 0:
                img.thumbnail((settings.max_side, settings.max_side))

            out = BytesIO()
            fmt = settings.output_format
            if fmt == "webp":
                img.save(out, format="WEBP", quality=settings.quality, method=6)
            elif fmt == "jpeg":
                rgb = img.convert("RGB")
                rgb.save(out, format="JPEG", quality=settings.quality, optimize=True, progressive=True)
            else:
                img.save(out, format="PNG", optimize=True)

            return GeneratedImage(content=out.getvalue(), mime_type=_FORMAT_TO_MIME[fmt])
    except Exception:
        return generated
