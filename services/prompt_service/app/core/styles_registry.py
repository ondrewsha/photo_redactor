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
                id="none",
                display_name="Без стиля",
                preview_image=_preview_svg("Без стиля", c1="#334155", c2="#0f172a"),
                hidden_prefix="",
                hidden_suffix="",
            ),
            StyleTemplate(
                id="cyberpunk",
                display_name="Киберпанк",
                preview_image=_preview_svg("Киберпанк", c1="#a21caf", c2="#06b6d4"),
                hidden_prefix=(
                    "Киберпанк. Ночной город. Неоновые вывески. Дождь и отражения. "
                    "Киношный кадр."
                ),
                hidden_suffix=(
                    "Контрастный свет. Туман в воздухе. Много деталей."
                ),
            ),
            StyleTemplate(
                id="oil_paint",
                display_name="Масло",
                preview_image=_preview_svg("Масло", c1="#f59e0b", c2="#fb7185"),
                hidden_prefix="Картина маслом на холсте. Выразительные мазки. Классическая живопись.",
                hidden_suffix="Тёплые тона. Фактура краски. Много деталей.",
            ),
            StyleTemplate(
                id="photoreal",
                display_name="Фотореализм",
                preview_image=_preview_svg("Фотореализм", c1="#10b981", c2="#38bdf8"),
                hidden_prefix="Фотореалистичное изображение. Натуральный свет. Реалистичные материалы.",
                hidden_suffix="Высокая детализация. Естественные цвета. Небольшая глубина резкости.",
            ),
            StyleTemplate(
                id="watercolor",
                display_name="Акварель",
                preview_image=_preview_svg("Акварель", c1="#38bdf8", c2="#a78bfa"),
                hidden_prefix="Акварельная иллюстрация. Мягкие размывы. Бумажная фактура.",
                hidden_suffix="Пастельная палитра. Лёгкие контуры. Воздушность.",
            ),
            StyleTemplate(
                id="anime",
                display_name="Аниме",
                preview_image=_preview_svg("Аниме", c1="#fb7185", c2="#6366f1"),
                hidden_prefix="Иллюстрация в стиле аниме. Чёткие линии. Выразительные персонажи.",
                hidden_suffix="Яркие тени. Динамичный свет. Чистые цвета.",
            ),
            StyleTemplate(
                id="pencil_sketch",
                display_name="Карандашный рисунок",
                preview_image=_preview_svg("Карандаш", c1="#94a3b8", c2="#0f172a"),
                hidden_prefix="Карандашный рисунок. Чёрно‑белая графика. Бумажная фактура.",
                hidden_suffix="Тонкие штрихи. Лёгкие тени. Чистые линии.",
            ),
            StyleTemplate(
                id="comic",
                display_name="Комикс",
                preview_image=_preview_svg("Комикс", c1="#f97316", c2="#ef4444"),
                hidden_prefix="Комикс. Чёткие контуры. Выразительная сцена.",
                hidden_suffix="Контраст. Динамика. Полутоновые точки.",
            ),
            StyleTemplate(
                id="pixel_art",
                display_name="Пиксельная графика",
                preview_image=_preview_svg("Пиксели", c1="#22c55e", c2="#0ea5e9"),
                hidden_prefix="Пиксельная графика. Ограниченная палитра. Крупные пиксели.",
                hidden_suffix="Ретро‑настроение. Простые формы. Чёткие края.",
            ),
            StyleTemplate(
                id="isometric",
                display_name="Изометрия",
                preview_image=_preview_svg("Изометрия", c1="#06b6d4", c2="#22c55e"),
                hidden_prefix="Изометрическая иллюстрация. Вид под углом. Чистые формы.",
                hidden_suffix="Аккуратные детали. Ровные линии. Мягкие тени.",
            ),
            StyleTemplate(
                id="minimal",
                display_name="Минимализм",
                preview_image=_preview_svg("Минимализм", c1="#e2e8f0", c2="#64748b"),
                hidden_prefix="Минималистичная иллюстрация. Много воздуха. Простые формы.",
                hidden_suffix="Чистый фон. Лаконичные линии. Спокойные цвета.",
            ),
            StyleTemplate(
                id="line_art",
                display_name="Линейный рисунок",
                preview_image=_preview_svg("Линии", c1="#d4d4d8", c2="#18181b"),
                hidden_prefix="Линейный рисунок. Тонкие линии. Без лишних деталей.",
                hidden_suffix="Чистый контур. Аккуратность. Белый фон.",
            ),
            StyleTemplate(
                id="noir",
                display_name="Чёрно‑белый нуар",
                preview_image=_preview_svg("Нуар", c1="#111827", c2="#6b7280"),
                hidden_prefix="Чёрно‑белый кадр. Жёсткий контраст. Атмосфера нуара.",
                hidden_suffix="Глубокие тени. Свет из окна. Дымка.",
            ),
            StyleTemplate(
                id="retro_poster",
                display_name="Ретро‑плакат",
                preview_image=_preview_svg("Ретро", c1="#f59e0b", c2="#06b6d4"),
                hidden_prefix="Ретро‑плакат. Яркие цвета. Большие формы.",
                hidden_suffix="Лёгкая зернистость. Градиенты. Сияние.",
            ),
            StyleTemplate(
                id="storybook",
                display_name="Детская книга",
                preview_image=_preview_svg("Детская книга", c1="#60a5fa", c2="#fbbf24"),
                hidden_prefix="Иллюстрация для детской книги. Добрый и мягкий стиль.",
                hidden_suffix="Тёплые цвета. Простые формы. Уютное настроение.",
            ),
            StyleTemplate(
                id="clay",
                display_name="Пластилин",
                preview_image=_preview_svg("Пластилин", c1="#a78bfa", c2="#fb7185"),
                hidden_prefix="Пластилиновая фигурка. Ручная лепка. Объёмные формы.",
                hidden_suffix="Мягкие тени. Матовая фактура. Тёплый свет.",
            ),
            StyleTemplate(
                id="fantasy",
                display_name="Сказочная иллюстрация",
                preview_image=_preview_svg("Сказка", c1="#22c55e", c2="#a78bfa"),
                hidden_prefix="Сказочная иллюстрация. Волшебная атмосфера. Мягкое свечение.",
                hidden_suffix="Красивый свет. Много деталей. Лёгкая дымка.",
            ),
            StyleTemplate(
                id="steampunk",
                display_name="Паровые механизмы",
                preview_image=_preview_svg("Механизмы", c1="#a16207", c2="#92400e"),
                hidden_prefix="Мир паровых механизмов. Шестерёнки, латунь, медь.",
                hidden_suffix="Тёплый свет. Детализация. Атмосфера мастерской.",
            ),
            StyleTemplate(
                id="flat_illustration",
                display_name="Плоская иллюстрация",
                preview_image=_preview_svg("Плоско", c1="#38bdf8", c2="#f97316"),
                hidden_prefix="Плоская иллюстрация. Простые формы. Чистые цвета.",
                hidden_suffix="Минимум деталей. Аккуратные контуры. Понятные силуэты.",
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
