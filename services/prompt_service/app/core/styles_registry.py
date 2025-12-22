from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote

from nanovisual_shared.schemas import StyleCategoryPublic

from app.core.errors import StyleNotFoundError


def _preview_svg(text: str, *, c1: str, c2: str) -> str:
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
<defs>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="{c1}"/>
    <stop offset="1" stop-color="{c2}"/>
  </linearGradient>
  <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="24"/>
  </filter>
</defs>
<rect width="640" height="360" fill="url(#g)"/>
<circle cx="120" cy="80" r="90" fill="rgba(255,255,255,0.18)" filter="url(#b)"/>
<circle cx="520" cy="260" r="120" fill="rgba(0,0,0,0.18)" filter="url(#b)"/>
<rect x="0" y="0" width="640" height="360" fill="rgba(0,0,0,0.35)"/>
<text x="48" y="310" fill="white" font-size="42" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-weight="700">{text}</text>
</svg>"""
    return "data:image/svg+xml;charset=utf-8," + quote(svg)


@dataclass(frozen=True, slots=True)
class StyleTemplate:
    id: str
    display_name: str
    preview_image: str
    description: str

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
                id="none",
                display_name="Без стиля",
                preview_image=_preview_svg("Без стиля", c1="#334155", c2="#0f172a"),
                description="",
            ),
            StyleTemplate(
                id="cyberpunk",
                display_name="Киберпанк",
                preview_image=_preview_svg("Киберпанк", c1="#a21caf", c2="#06b6d4"),
                description="Ночной город, неон, дождь и отражения, контрастный свет, лёгкий туман, много мелких деталей.",
            ),
            StyleTemplate(
                id="oil_paint",
                display_name="Масло",
                preview_image=_preview_svg("Масло", c1="#f59e0b", c2="#fb7185"),
                description="Картина маслом на холсте: выразительные мазки, тёплые тона, заметная фактура краски, высокая детализация.",
            ),
            StyleTemplate(
                id="photoreal",
                display_name="Фотореализм",
                preview_image=_preview_svg("Фотореализм", c1="#10b981", c2="#38bdf8"),
                description="Как реальное фото: натуральный свет, реалистичные материалы, естественные цвета, высокая детализация, лёгкое размытие фона.",
            ),
            StyleTemplate(
                id="watercolor",
                display_name="Акварель",
                preview_image=_preview_svg("Акварель", c1="#38bdf8", c2="#a78bfa"),
                description="Акварель: мягкие размывы, бумажная фактура, пастельные цвета, лёгкие контуры, ощущение воздуха.",
            ),
            StyleTemplate(
                id="anime",
                display_name="Аниме",
                preview_image=_preview_svg("Аниме", c1="#fb7185", c2="#6366f1"),
                description="Аниме: чёткие линии, выразительные персонажи, чистые цвета, динамичный свет и тени.",
            ),
            StyleTemplate(
                id="pencil_sketch",
                display_name="Карандашный рисунок",
                preview_image=_preview_svg("Карандаш", c1="#94a3b8", c2="#0f172a"),
                description="Карандаш: чёрно‑белая графика, бумажная фактура, тонкие штрихи, лёгкие тени, аккуратные линии.",
            ),
            StyleTemplate(
                id="comic",
                display_name="Комикс",
                preview_image=_preview_svg("Комикс", c1="#f97316", c2="#ef4444"),
                description="Комикс: чёткие контуры, контраст, динамика, полутоновые точки (растр), выразительная сцена.",
            ),
            StyleTemplate(
                id="pixel_art",
                display_name="Пиксельная графика",
                preview_image=_preview_svg("Пиксели", c1="#22c55e", c2="#0ea5e9"),
                description="Пиксельная графика: крупные пиксели, ограниченная палитра, простые формы, ретро‑настроение, чёткие края.",
            ),
            StyleTemplate(
                id="isometric",
                display_name="Изометрия",
                preview_image=_preview_svg("Изометрия", c1="#06b6d4", c2="#22c55e"),
                description="Изометрия: вид под углом, аккуратные формы, ровные линии, мягкие тени, понятная геометрия.",
            ),
            StyleTemplate(
                id="minimal",
                display_name="Минимализм",
                preview_image=_preview_svg("Минимализм", c1="#e2e8f0", c2="#64748b"),
                description="Минимализм: много воздуха, простые формы, чистый фон, спокойные цвета, минимум деталей.",
            ),
            StyleTemplate(
                id="line_art",
                display_name="Линейный рисунок",
                preview_image=_preview_svg("Линии", c1="#d4d4d8", c2="#18181b"),
                description="Линейный рисунок: тонкие линии, чистый контур, белый фон, минимум деталей, аккуратность.",
            ),
            StyleTemplate(
                id="noir",
                display_name="Чёрно‑белый нуар",
                preview_image=_preview_svg("Нуар", c1="#111827", c2="#6b7280"),
                description="Нуар: чёрно‑белая сцена, жёсткий контраст, глубокие тени, свет из окна, лёгкая дымка.",
            ),
            StyleTemplate(
                id="retro_poster",
                display_name="Ретро‑плакат",
                preview_image=_preview_svg("Ретро", c1="#f59e0b", c2="#06b6d4"),
                description="Ретро‑плакат: яркие цвета, крупные формы, лёгкая зернистость, мягкие градиенты, лёгкое сияние.",
            ),
            StyleTemplate(
                id="storybook",
                display_name="Детская книга",
                preview_image=_preview_svg("Детская книга", c1="#60a5fa", c2="#fbbf24"),
                description="Детская книга: добрый и мягкий рисунок, тёплые цвета, простые формы, уютное настроение.",
            ),
            StyleTemplate(
                id="clay",
                display_name="Пластилин",
                preview_image=_preview_svg("Пластилин", c1="#a78bfa", c2="#fb7185"),
                description="Пластилин: ручная лепка, объёмные формы, матовая фактура, тёплый свет, мягкие тени.",
            ),
            StyleTemplate(
                id="fantasy",
                display_name="Сказочная иллюстрация",
                preview_image=_preview_svg("Сказка", c1="#22c55e", c2="#a78bfa"),
                description="Сказочная иллюстрация: волшебная атмосфера, мягкое свечение, красивый свет, много деталей, лёгкая дымка.",
            ),
            StyleTemplate(
                id="steampunk",
                display_name="Паровые механизмы",
                preview_image=_preview_svg("Механизмы", c1="#a16207", c2="#92400e"),
                description="Паровые механизмы: шестерёнки, латунь и медь, атмосфера мастерской, тёплый свет, высокая детализация.",
            ),
            StyleTemplate(
                id="flat_illustration",
                display_name="Плоская иллюстрация",
                preview_image=_preview_svg("Плоско", c1="#38bdf8", c2="#f97316"),
                description="Плоская иллюстрация: простые формы, чистые цвета, минимум деталей, аккуратные контуры, понятные силуэты.",
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
