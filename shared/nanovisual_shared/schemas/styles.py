from __future__ import annotations

from pydantic import Field

from .common import BaseSchema


class StyleCategoryPublic(BaseSchema):
    id: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, description="Category name for grouping styles.")
    display_name: str = Field(..., min_length=1)
    preview_image: str = Field(..., min_length=1, description="Path or URL to a preview image.")
