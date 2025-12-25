from __future__ import annotations

from typing import Literal

from pydantic import Field

from .common import BaseSchema


class ImageSizePreset(BaseSchema):
    id: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    width: int = Field(..., ge=1)
    height: int = Field(..., ge=1)
    aspect_ratio: str | None = Field(default=None, description="For Gemini/Imagen models.")
    quality: str | None = Field(default=None, description="For Gemini/Imagen models (1K/2K/4K).")


class GenerationCapabilities(BaseSchema):
    image_provider: Literal["mock", "openai", "gemini"]
    model: str = Field(..., min_length=1)
    supports_source_images: bool = False
    max_photos: int = Field(4, ge=1, le=10)
    size_presets: list[ImageSizePreset] = Field(default_factory=list)
