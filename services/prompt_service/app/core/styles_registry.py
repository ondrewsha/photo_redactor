from __future__ import annotations

from dataclasses import dataclass

from nanovisual_shared.schemas import StyleCategoryPublic

from app.core.errors import StyleNotFoundError


@dataclass(frozen=True, slots=True)
class StyleTemplate:
    id: str
    display_name: str
    preview_image: str
    hidden_prefix: str
    hidden_suffix: str

    def public(self) -> StyleCategoryPublic:
        return StyleCategoryPublic(
            id=self.id,
            display_name=self.display_name,
            preview_image=self.preview_image,
        )


class StyleRegistry:
    def __init__(self, templates: list[StyleTemplate]) -> None:
        self._templates = templates
        self._by_id = {t.id: t for t in templates}

    @classmethod
    def default(cls) -> "StyleRegistry":
        templates = [
            StyleTemplate(
                id="cyberpunk",
                display_name="Киберпанк",
                preview_image="/static/styles/cyberpunk.webp",
                hidden_prefix=(
                    "Cyberpunk city scene, neon lights, rain-soaked streets, ultra-detailed,"
                    " cinematic composition"
                ),
                hidden_suffix=(
                    "high contrast, sharp focus, volumetric lighting, vibrant colors, 8k"
                ),
            ),
            StyleTemplate(
                id="oil_paint",
                display_name="Масло",
                preview_image="/static/styles/oil_paint.webp",
                hidden_prefix="Oil painting on canvas, rich brush strokes, classical art direction",
                hidden_suffix="museum-quality, textured paint, warm tones",
            ),
            StyleTemplate(
                id="photoreal",
                display_name="Фотореализм",
                preview_image="/static/styles/photoreal.webp",
                hidden_prefix="Photorealistic, natural lighting, realistic materials, DSLR look",
                hidden_suffix="high detail, shallow depth of field, film grain, true-to-life colors",
            ),
            StyleTemplate(
                id="watercolor",
                display_name="Акварель",
                preview_image="/static/styles/watercolor.webp",
                hidden_prefix="Watercolor illustration, soft washes, paper texture, airy feel",
                hidden_suffix="gentle gradients, subtle ink outlines, pastel palette",
            ),
            StyleTemplate(
                id="anime",
                display_name="Аниме",
                preview_image="/static/styles/anime.webp",
                hidden_prefix="Anime style illustration, clean line art, expressive characters",
                hidden_suffix="vibrant shading, crisp outlines, dynamic lighting",
            ),
        ]
        return cls(templates=templates)

    def list_public(self) -> list[StyleCategoryPublic]:
        return [t.public() for t in self._templates]

    def get(self, style_id: str) -> StyleTemplate:
        template = self._by_id.get(style_id)
        if template is None:
            raise StyleNotFoundError(style_id)
        return template
