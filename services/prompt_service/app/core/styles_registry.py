from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import quote

from nanovisual_shared.schemas import StyleCategoryPublic

from app.core.errors import StyleNotFoundError


_ICONS: dict[str, str] = {
    "spark": """
<path d="M0 -56 L16 -20 L54 -20 L22 2 L34 48 L0 26 L-34 48 L-22 2 L-54 -20 L-16 -20 Z"/>
""".strip(),
    "camera": """
<rect x="-78" y="-36" width="156" height="92" rx="18"/>
<circle cx="0" cy="10" r="26"/>
<rect x="-46" y="-58" width="54" height="26" rx="10"/>
""".strip(),
    "film": """
<rect x="-78" y="-46" width="156" height="102" rx="16"/>
<path d="M-40 -46 V56 M40 -46 V56"/>
<circle cx="-60" cy="-26" r="6"/><circle cx="-60" cy="0" r="6"/><circle cx="-60" cy="26" r="6"/>
<circle cx="60" cy="-26" r="6"/><circle cx="60" cy="0" r="6"/><circle cx="60" cy="26" r="6"/>
""".strip(),
    "brush": """
<path d="M-54 44 C-20 24 6 12 44 -30"/>
<path d="M30 -10 L54 -34"/>
<path d="M-18 52 C-8 36 8 36 18 52"/>
""".strip(),
    "palette": """
<path d="M-8 -58 C-44 -54 -66 -28 -62 4 C-58 36 -26 56 6 56 C20 56 28 48 28 36 C28 28 24 22 20 18 C14 12 10 8 10 0 C10 -10 18 -18 30 -18 C44 -18 54 -8 58 6 C66 34 46 58 14 58"/>
<circle cx="-28" cy="-18" r="6"/><circle cx="-10" cy="-30" r="6"/><circle cx="10" cy="-26" r="6"/><circle cx="28" cy="-10" r="6"/>
""".strip(),
    "postcard": """
<rect x="-82" y="-52" width="164" height="104" rx="18"/>
<path d="M-24 -52 V52"/>
<rect x="34" y="-38" width="34" height="34" rx="10"/>
<path d="M-70 -22 H-36 M-70 0 H-36 M-70 22 H-36"/>
""".strip(),
    "star": """
<path d="M0 -56 L14 -22 L50 -22 L20 -2 L32 44 L0 24 L-32 44 L-20 -2 L-50 -22 L-14 -22 Z"/>
""".strip(),
    "snow": """
<path d="M0 -58 V58 M-50 -28 L50 28 M-50 28 L50 -28"/>
<path d="M0 -38 L-12 -50 M0 -38 L12 -50 M0 38 L-12 50 M0 38 L12 50"/>
<path d="M-32 -18 L-46 -24 M-32 -18 L-46 -12 M32 18 L46 24 M32 18 L46 12"/>
<path d="M-32 18 L-46 24 M-32 18 L-46 12 M32 -18 L46 -24 M32 -18 L46 -12"/>
""".strip(),
    "heart": """
<path d="M0 52 C-58 14 -64 -20 -44 -40 C-26 -58 -6 -46 0 -30 C6 -46 26 -58 44 -40 C64 -20 58 14 0 52 Z"/>
""".strip(),
    "gift": """
<rect x="-70" y="-10" width="140" height="78" rx="14"/>
<path d="M0 -10 V68 M-70 20 H70"/>
<path d="M-22 -10 C-44 -10 -46 -42 -20 -42 C-4 -42 -2 -26 0 -10"/>
<path d="M22 -10 C44 -10 46 -42 20 -42 C4 -42 2 -26 0 -10"/>
""".strip(),
    "pumpkin": """
<ellipse cx="0" cy="10" rx="60" ry="50"/>
<path d="M0 -40 V60"/>
<path d="M-26 -34 C-38 -6 -38 26 -26 54"/>
<path d="M26 -34 C38 -6 38 26 26 54"/>
<path d="M0 -48 C0 -64 18 -70 18 -56"/>
""".strip(),
    "rocket": """
<path d="M0 -60 C24 -40 36 -14 36 14 C36 44 18 60 0 60 C-18 60 -36 44 -36 14 C-36 -14 -24 -40 0 -60 Z"/>
<circle cx="0" cy="-16" r="12"/>
<path d="M-36 18 L-56 34 M36 18 L56 34"/>
<path d="M0 60 L-10 78 M0 60 L10 78"/>
""".strip(),
    "robot": """
<rect x="-70" y="-46" width="140" height="96" rx="18"/>
<path d="M-30 -46 V-70 H30 V-46"/>
<circle cx="-26" cy="-6" r="10"/><circle cx="26" cy="-6" r="10"/>
<path d="M-30 26 H30"/>
""".strip(),
    "leaf": """
<path d="M-54 40 C-22 -12 16 -52 60 -54 C56 -8 22 30 -28 54 C-42 60 -54 54 -54 40 Z"/>
<path d="M-34 44 C-6 28 20 2 44 -34"/>
""".strip(),
    "mountain": """
<path d="M-78 56 L-26 -10 L0 20 L18 -2 L78 56 Z"/>
<path d="M-26 -10 L-10 10 M18 -2 L32 16"/>
""".strip(),
}


def _pattern_defs(pattern: str, accent: str) -> str:
    if pattern == "grid":
        return f"""
<pattern id="p" width="24" height="24" patternUnits="userSpaceOnUse">
  <path d="M24 0H0V24" fill="none" stroke="{accent}" stroke-opacity="0.10" stroke-width="2"/>
</pattern>
""".strip()
    if pattern == "stripes":
        return f"""
<pattern id="p" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
  <path d="M0 0H20" fill="none" stroke="{accent}" stroke-opacity="0.10" stroke-width="6"/>
</pattern>
""".strip()
    if pattern == "pixels":
        return f"""
<pattern id="p" width="18" height="18" patternUnits="userSpaceOnUse">
  <rect x="0" y="0" width="6" height="6" fill="{accent}" fill-opacity="0.12"/>
  <rect x="12" y="6" width="6" height="6" fill="{accent}" fill-opacity="0.08"/>
  <rect x="6" y="12" width="6" height="6" fill="{accent}" fill-opacity="0.10"/>
</pattern>
""".strip()
    if pattern == "confetti":
        return f"""
<pattern id="p" width="32" height="32" patternUnits="userSpaceOnUse">
  <circle cx="6" cy="10" r="3" fill="{accent}" fill-opacity="0.16"/>
  <rect x="18" y="6" width="6" height="6" rx="2" fill="{accent}" fill-opacity="0.12"/>
  <circle cx="24" cy="24" r="2.8" fill="{accent}" fill-opacity="0.12"/>
  <rect x="6" y="22" width="5" height="5" rx="2" fill="{accent}" fill-opacity="0.10"/>
</pattern>
""".strip()
    if pattern == "paper":
        return f"""
<filter id="noise">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
  <feColorMatrix type="matrix" values="
    1 0 0 0 0
    0 1 0 0 0
    0 0 1 0 0
    0 0 0 0.25 0" />
</filter>
""".strip()
    return f"""
<pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse">
  <circle cx="4" cy="6" r="2.2" fill="{accent}" fill-opacity="0.14"/>
  <circle cx="18" cy="16" r="2.2" fill="{accent}" fill-opacity="0.10"/>
</pattern>
""".strip()


def _preview_svg(
    title: str,
    *,
    bg: str,
    accent: str,
    icon: str,
    pattern: str = "dots",
    fg: str = "#ffffff",
) -> str:
    defs = _pattern_defs(pattern, accent)
    label_bg = "rgba(0,0,0,0.45)" if fg == "#ffffff" else "rgba(255,255,255,0.55)"
    icon_svg = _ICONS.get(icon, _ICONS["spark"])
    overlay = (
        '<rect width="640" height="360" rx="32" fill="url(#p)"/>'
        if pattern != "paper"
        else '<rect width="640" height="360" rx="32" filter="url(#noise)" opacity="0.55"/>'
    )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
<defs>
{defs}
</defs>
<rect width="640" height="360" rx="32" fill="{bg}"/>
{overlay}
<g transform="translate(320 160)" fill="none" stroke="{accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
{icon_svg}
</g>
<rect x="22" y="268" width="596" height="72" rx="22" fill="{label_bg}"/>
<text x="48" y="318" fill="{fg}" font-size="38" font-family="system-ui, -apple-system, Segoe UI, Roboto, Arial" font-weight="800">{title}</text>
</svg>"""
    return "data:image/svg+xml;charset=utf-8," + quote(svg)


@dataclass(frozen=True, slots=True)
class StyleTemplate:
    id: str
    category: str
    display_name: str
    preview_image: str
    description: str

    def public(self) -> StyleCategoryPublic:
        return StyleCategoryPublic(
            id=self.id,
            category=self.category,
            display_name=self.display_name,
            preview_image=self.preview_image,
        )


def _style(
    *,
    id: str,
    category: str,
    name: str,
    description: str,
    preview_text: str | None = None,
    bg: str,
    accent: str,
    icon: str,
    pattern: str = "dots",
    fg: str = "#ffffff",
) -> StyleTemplate:
    return StyleTemplate(
        id=id,
        category=category,
        display_name=name,
        preview_image=_preview_svg(
            preview_text or name,
            bg=bg,
            accent=accent,
            icon=icon,
            pattern=pattern,
            fg=fg,
        ),
        description=description,
    )


class StyleRegistry:
    def __init__(self, templates: list[StyleTemplate]) -> None:
        self._templates = templates
        self._by_id = {t.id: t for t in templates}

    @classmethod
    def default(cls) -> "StyleRegistry":
        cat_base = "Базовые"
        cat_photo = "Фото и кино"
        cat_art = "Рисунок и живопись"
        cat_holidays = "Праздники"
        cat_retro = "Ретро и СССР"
        cat_worlds = "Фантастика и миры"
        cat_nature = "Природа и настроение"
        cat_design = "Дизайн и графика"

        templates = [
            _style(
                id="none",
                category=cat_base,
                name="Без стиля",
                preview_text="Без стиля",
                description="",
                bg="#0b1220",
                accent="#94a3b8",
                icon="spark",
                pattern="grid",
            ),
            _style(
                id="photoreal",
                category=cat_photo,
                name="Фотореализм",
                preview_text="Фото",
                description="Как реальное фото: натуральный свет, реалистичные материалы, естественные цвета, высокая детализация, лёгкое размытие фона.",
                bg="#0b0f19",
                accent="#22c55e",
                icon="camera",
                pattern="grid",
            ),
            _style(
                id="cinematic",
                category=cat_photo,
                name="Киношный кадр",
                preview_text="Кино",
                description="Как кадр из фильма: выразительный свет, атмосфера, продуманная композиция, лёгкое зерно, мягкие тени.",
                bg="#0f172a",
                accent="#f97316",
                icon="film",
                pattern="stripes",
            ),
            _style(
                id="noir",
                category=cat_photo,
                name="Чёрно‑белый нуар",
                preview_text="Нуар",
                description="Нуар: чёрно‑белая сцена, жёсткий контраст, глубокие тени, свет из окна, лёгкая дымка.",
                bg="#0b1020",
                accent="#e5e7eb",
                icon="film",
                pattern="grid",
            ),
            _style(
                id="film_photo",
                category=cat_photo,
                name="Плёночное фото",
                preview_text="Плёнка",
                description="Плёночное фото: тёплый оттенок, заметное зерно, лёгкая мягкость, небольшие дефекты плёнки.",
                bg="#1b1a16",
                accent="#fbbf24",
                icon="film",
                pattern="stripes",
            ),
            _style(
                id="instant_photo",
                category=cat_photo,
                name="Моментальное фото",
                preview_text="Моментальное",
                description="Моментальное фото: мягкие цвета, чуть выцветший оттенок, рамка как у снимка, уютное настроение.",
                bg="#111827",
                accent="#a78bfa",
                icon="camera",
                pattern="dots",
            ),
            _style(
                id="vhs_video",
                category=cat_photo,
                name="Кассетное видео",
                preview_text="Кассета",
                description="Кассетное видео: лёгкие помехи, шум, полосы, чуть размытая картинка, оттенок старого экрана.",
                bg="#0a0a0a",
                accent="#38bdf8",
                icon="film",
                pattern="pixels",
            ),
            _style(
                id="studio_light",
                category=cat_photo,
                name="Студийный свет",
                preview_text="Студия",
                description="Студийный свет: чистый фон, мягкий рассеянный свет, аккуратные тени, красивый объём.",
                bg="#0f172a",
                accent="#60a5fa",
                icon="camera",
                pattern="dots",
            ),
            _style(
                id="macro",
                category=cat_photo,
                name="Макро",
                preview_text="Макро",
                description="Макро: крупный план, очень мелкие детали, мягкий фон, выразительная текстура.",
                bg="#071312",
                accent="#22c55e",
                icon="leaf",
                pattern="dots",
            ),
            _style(
                id="portrait",
                category=cat_photo,
                name="Портрет",
                preview_text="Портрет",
                description="Портрет: внимание на лице, мягкий свет, аккуратные цвета, приятный фон и глубина.",
                bg="#0b1220",
                accent="#fda4af",
                icon="camera",
                pattern="grid",
            ),
            _style(
                id="oil_paint",
                category=cat_art,
                name="Масло",
                preview_text="Масло",
                description="Картина маслом на холсте: выразительные мазки, тёплые тона, заметная фактура краски, высокая детализация.",
                bg="#2a1a10",
                accent="#fb7185",
                icon="brush",
                pattern="paper",
            ),
            _style(
                id="watercolor",
                category=cat_art,
                name="Акварель",
                preview_text="Акварель",
                description="Акварель: мягкие размывы, бумажная фактура, пастельные цвета, лёгкие контуры, ощущение воздуха.",
                bg="#0f172a",
                accent="#38bdf8",
                icon="palette",
                pattern="paper",
            ),
            _style(
                id="gouache",
                category=cat_art,
                name="Гуашь",
                preview_text="Гуашь",
                description="Гуашь: плотные мазки, матовая краска, яркие пятна цвета, простая и выразительная форма.",
                bg="#0b1020",
                accent="#f97316",
                icon="brush",
                pattern="dots",
            ),
            _style(
                id="pencil_sketch",
                category=cat_art,
                name="Карандашный рисунок",
                preview_text="Карандаш",
                description="Карандаш: чёрно‑белая графика, бумажная фактура, тонкие штрихи, лёгкие тени, аккуратные линии.",
                bg="#111827",
                accent="#e5e7eb",
                icon="brush",
                pattern="paper",
            ),
            _style(
                id="charcoal",
                category=cat_art,
                name="Уголь",
                preview_text="Уголь",
                description="Угольный рисунок: мягкие тени, выразительные пятна, немного пыли, глубокий чёрный цвет.",
                bg="#0a0a0a",
                accent="#a1a1aa",
                icon="brush",
                pattern="paper",
            ),
            _style(
                id="ink",
                category=cat_art,
                name="Тушь",
                preview_text="Тушь",
                description="Тушь и кисть: контрастные линии, пятна, немного брызг, ощущение живого рисунка.",
                bg="#0b1020",
                accent="#93c5fd",
                icon="brush",
                pattern="stripes",
            ),
            _style(
                id="line_art",
                category=cat_art,
                name="Линейный рисунок",
                preview_text="Линии",
                description="Линейный рисунок: тонкие линии, чистый контур, белый фон, минимум деталей, аккуратность.",
                bg="#101828",
                accent="#e5e7eb",
                icon="brush",
                pattern="grid",
            ),
            _style(
                id="coloring",
                category=cat_art,
                name="Раскраска",
                preview_text="Раскраска",
                description="Раскраска: чёткий контур, белый фон, крупные области для цвета, простые формы.",
                bg="#0f172a",
                accent="#f8fafc",
                icon="brush",
                pattern="grid",
            ),
            _style(
                id="comic",
                category=cat_art,
                name="Комикс",
                preview_text="Комикс",
                description="Комикс: чёткие контуры, контраст, динамика, полутоновые точки (растр), выразительная сцена.",
                bg="#111827",
                accent="#f97316",
                icon="spark",
                pattern="dots",
            ),
            _style(
                id="anime",
                category=cat_art,
                name="Аниме",
                preview_text="Аниме",
                description="Аниме: чёткие линии, выразительные персонажи, чистые цвета, динамичный свет и тени.",
                bg="#0b1220",
                accent="#a78bfa",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="pixel_art",
                category=cat_art,
                name="Пиксельная графика",
                preview_text="Пиксели",
                description="Пиксельная графика: крупные пиксели, ограниченная палитра, простые формы, ретро‑настроение, чёткие края.",
                bg="#0f172a",
                accent="#22c55e",
                icon="spark",
                pattern="pixels",
            ),
            _style(
                id="isometric",
                category=cat_art,
                name="Изометрия",
                preview_text="Изометрия",
                description="Изометрия: вид под углом, аккуратные формы, ровные линии, мягкие тени, понятная геометрия.",
                bg="#0b1220",
                accent="#38bdf8",
                icon="mountain",
                pattern="grid",
            ),
            _style(
                id="flat_illustration",
                category=cat_art,
                name="Плоская иллюстрация",
                preview_text="Плоско",
                description="Плоская иллюстрация: простые формы, чистые цвета, минимум деталей, аккуратные контуры, понятные силуэты.",
                bg="#0b1020",
                accent="#60a5fa",
                icon="spark",
                pattern="grid",
            ),
            _style(
                id="storybook",
                category=cat_art,
                name="Детская книга",
                preview_text="Детская",
                description="Детская книга: добрый и мягкий рисунок, тёплые цвета, простые формы, уютное настроение.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="clay",
                category=cat_art,
                name="Пластилин",
                preview_text="Пластилин",
                description="Пластилин: ручная лепка, объёмные формы, матовая фактура, тёплый свет, мягкие тени.",
                bg="#111827",
                accent="#fb7185",
                icon="spark",
                pattern="dots",
            ),
            _style(
                id="paper_cut",
                category=cat_art,
                name="Бумажная аппликация",
                preview_text="Аппликация",
                description="Бумажная аппликация: слои бумаги, мягкие тени между слоями, аккуратные края, тёплые цвета.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="postcard",
                pattern="paper",
            ),
            _style(
                id="origami",
                category=cat_art,
                name="Оригами",
                preview_text="Оригами",
                description="Оригами: бумажные сгибы, простые формы, чистые цвета, мягкие тени, аккуратные края.",
                bg="#0b1220",
                accent="#60a5fa",
                icon="postcard",
                pattern="grid",
            ),
            _style(
                id="embroidery",
                category=cat_art,
                name="Вышивка",
                preview_text="Вышивка",
                description="Вышивка: нитки и стежки, тканевая фактура, ручная работа, тёплый свет.",
                bg="#0b1020",
                accent="#fda4af",
                icon="spark",
                pattern="paper",
            ),
            _style(
                id="stained_glass",
                category=cat_art,
                name="Витраж",
                preview_text="Витраж",
                description="Витраж: цветные стеклянные сегменты, чёрные перегородки, яркий свет, сияние.",
                bg="#0b1220",
                accent="#22c55e",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="mosaic",
                category=cat_art,
                name="Мозаика",
                preview_text="Мозаика",
                description="Мозаика: мелкие плитки, неровные края, живая фактура, блеск и тени.",
                bg="#0b1020",
                accent="#38bdf8",
                icon="spark",
                pattern="pixels",
            ),
            _style(
                id="graffiti",
                category=cat_art,
                name="Граффити",
                preview_text="Граффити",
                description="Граффити: яркие краски, аэрозольные мягкие края, брызги, городская стена.",
                bg="#0a0a0a",
                accent="#f97316",
                icon="spark",
                pattern="stripes",
            ),
            _style(
                id="neon_sign",
                category=cat_worlds,
                name="Неоновая вывеска",
                preview_text="Неон",
                description="Неоновая вывеска: яркое свечение, тёмный фон, мягкие ореолы, отражения, ночная атмосфера.",
                bg="#0b1020",
                accent="#22d3ee",
                icon="spark",
                pattern="dots",
            ),
            _style(
                id="minimal",
                category=cat_base,
                name="Минимализм",
                preview_text="Минимализм",
                description="Минимализм: много воздуха, простые формы, чистый фон, спокойные цвета, минимум деталей.",
                bg="#0b1220",
                accent="#94a3b8",
                icon="spark",
                pattern="grid",
            ),
            _style(
                id="cozy",
                category=cat_base,
                name="Уютный вечер",
                preview_text="Уют",
                description="Уют: тёплый свет, мягкие тени, спокойные цвета, домашняя атмосфера, приятные детали.",
                bg="#1b1a16",
                accent="#fbbf24",
                icon="spark",
                pattern="dots",
            ),
            _style(
                id="pastel",
                category=cat_base,
                name="Пастель",
                preview_text="Пастель",
                description="Пастельные цвета: мягкая палитра, нежные переходы, лёгкость, спокойное настроение.",
                bg="#0b1220",
                accent="#fda4af",
                icon="palette",
                pattern="confetti",
            ),
            _style(
                id="dramatic_light",
                category=cat_base,
                name="Драматичный свет",
                preview_text="Свет",
                description="Драматичный свет: сильный контраст, яркие блики, глубокие тени, выразительный объём.",
                bg="#0b0f19",
                accent="#f97316",
                icon="spark",
                pattern="stripes",
            ),
            _style(
                id="new_year",
                category=cat_holidays,
                name="Новый год",
                preview_text="Новый год",
                description="Новогодняя открытка: ёлочные огни, снег, блёстки, праздничное настроение, тёплый свет.",
                bg="#0b1220",
                accent="#38bdf8",
                icon="snow",
                pattern="confetti",
            ),
            _style(
                id="new_year_ussr",
                category=cat_holidays,
                name="Новогодняя открытка СССР",
                preview_text="СССР • НГ",
                description="Новогодняя открытка СССР: винтажная бумага, печатная фактура, простые формы, тёплые цвета, лёгкая зернистость.",
                bg="#f3e9d2",
                fg="#111827",
                accent="#dc2626",
                icon="star",
                pattern="paper",
            ),
            _style(
                id="christmas",
                category=cat_holidays,
                name="Рождество",
                preview_text="Рождество",
                description="Рождественская открытка: тёплые огни, уют, мягкий свет, праздничные детали, нежные цвета.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="gift",
                pattern="confetti",
            ),
            _style(
                id="birthday",
                category=cat_holidays,
                name="День рождения",
                preview_text="Праздник",
                description="Праздничная открытка: шарики, конфетти, торт, яркие цвета, радостное настроение.",
                bg="#0b1220",
                accent="#fb7185",
                icon="gift",
                pattern="confetti",
            ),
            _style(
                id="wedding",
                category=cat_holidays,
                name="Свадьба",
                preview_text="Свадьба",
                description="Свадебная открытка: нежные цвета, мягкий свет, чистый фон, романтичные детали, аккуратная композиция.",
                bg="#0b1220",
                accent="#e5e7eb",
                icon="heart",
                pattern="dots",
            ),
            _style(
                id="valentine",
                category=cat_holidays,
                name="Валентинка",
                preview_text="Любовь",
                description="Валентинка: сердечки, нежные цвета, мягкий свет, тёплое настроение, аккуратные детали.",
                bg="#0b1220",
                accent="#fb7185",
                icon="heart",
                pattern="confetti",
            ),
            _style(
                id="womens_day",
                category=cat_holidays,
                name="8 марта",
                preview_text="8 марта",
                description="Открытка к 8 марта: весенние цветы, нежные цвета, тёплый свет, лёгкость и радость.",
                bg="#0b1220",
                accent="#fda4af",
                icon="leaf",
                pattern="confetti",
            ),
            _style(
                id="victory_day",
                category=cat_holidays,
                name="9 мая",
                preview_text="9 мая",
                description="Праздничная открытка: ленты, звезда, тёплый свет, уважительный тон, аккуратные детали.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="star",
                pattern="confetti",
            ),
            _style(
                id="halloween",
                category=cat_holidays,
                name="Хэллоуин",
                preview_text="Хэллоуин",
                description="Хэллоуин: тёмная ночь, фонари, тыквы, туман, оранжевый свет, немного жути, но без крови.",
                bg="#0a0a0a",
                accent="#f97316",
                icon="pumpkin",
                pattern="dots",
            ),
            _style(
                id="easter",
                category=cat_holidays,
                name="Пасха",
                preview_text="Пасха",
                description="Пасхальная открытка: нежные цвета, весенний свет, яйца, цветы, чистый фон, уют.",
                bg="#0b1220",
                accent="#a78bfa",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="graduation",
                category=cat_holidays,
                name="Выпускной",
                preview_text="Выпускной",
                description="Открытка: яркий свет, конфетти, праздничные детали, чистая композиция, радость.",
                bg="#0b1220",
                accent="#38bdf8",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="ussr_postcard",
                category=cat_retro,
                name="Открытка СССР",
                preview_text="Открытка СССР",
                description="Старая открытка СССР: винтажная бумага, печатная фактура, лёгкая выцветшая палитра, простые формы, тёплый оттенок.",
                bg="#f3e9d2",
                fg="#111827",
                accent="#dc2626",
                icon="postcard",
                pattern="paper",
            ),
            _style(
                id="soviet_poster",
                category=cat_retro,
                name="Советский плакат",
                preview_text="Плакат",
                description="Советский плакат: крупные формы, контрастные цвета, печатная фактура, выразительная композиция, минимум лишнего.",
                bg="#f3e9d2",
                fg="#111827",
                accent="#b91c1c",
                icon="star",
                pattern="paper",
            ),
            _style(
                id="constructivism",
                category=cat_retro,
                name="Конструктивизм",
                preview_text="Конструктивизм",
                description="Конструктивизм: геометрия, диагонали, контраст, большие формы, ограниченная палитра, печатная фактура.",
                bg="#0b1220",
                accent="#f97316",
                icon="spark",
                pattern="stripes",
            ),
            _style(
                id="art_deco",
                category=cat_retro,
                name="Ар‑деко",
                preview_text="Ар‑деко",
                description="Ар‑деко: симметрия, чёткие линии, геометрия, золото и чёрный, аккуратная роскошь.",
                bg="#0a0a0a",
                accent="#fbbf24",
                icon="spark",
                pattern="grid",
            ),
            _style(
                id="aged_paper",
                category=cat_retro,
                name="Старая бумага",
                preview_text="Бумага",
                description="Старая бумага: потёртости, мягкая выцветшая палитра, печатная фактура, лёгкие пятна времени.",
                bg="#f3e9d2",
                fg="#111827",
                accent="#a16207",
                icon="postcard",
                pattern="paper",
            ),
            _style(
                id="newspaper",
                category=cat_retro,
                name="Газетная печать",
                preview_text="Газета",
                description="Газетная печать: чёрно‑белая фактура, растр, грубая бумага, чуть размытые края, винтаж.",
                bg="#e5e7eb",
                fg="#111827",
                accent="#111827",
                icon="postcard",
                pattern="paper",
            ),
            _style(
                id="eighties",
                category=cat_retro,
                name="80‑е",
                preview_text="80‑е",
                description="80‑е: яркие цвета, неоновые акценты, простая геометрия, лёгкая зернистость.",
                bg="#0b1220",
                accent="#22d3ee",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="nineties",
                category=cat_retro,
                name="90‑е",
                preview_text="90‑е",
                description="90‑е: контрастные цвета, немного хаоса, грубая печать, наклейки и маркеры, лёгкий шум.",
                bg="#0b1220",
                accent="#f97316",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="retro_poster",
                category=cat_retro,
                name="Ретро‑плакат",
                preview_text="Ретро",
                description="Ретро‑плакат: яркие цвета, крупные формы, лёгкая зернистость, мягкие переходы, лёгкое сияние.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="postcard",
                pattern="paper",
            ),
            _style(
                id="cyberpunk",
                category=cat_worlds,
                name="Киберпанк",
                preview_text="Киберпанк",
                description="Ночной город, неон, дождь и отражения, контрастный свет, лёгкий туман, много мелких деталей.",
                bg="#0b1020",
                accent="#22d3ee",
                icon="robot",
                pattern="stripes",
            ),
            _style(
                id="steampunk",
                category=cat_worlds,
                name="Паровые механизмы",
                preview_text="Механизмы",
                description="Паровые механизмы: шестерёнки, латунь и медь, атмосфера мастерской, тёплый свет, высокая детализация.",
                bg="#1b1a16",
                accent="#fbbf24",
                icon="spark",
                pattern="paper",
            ),
            _style(
                id="fantasy",
                category=cat_worlds,
                name="Сказочный мир",
                preview_text="Сказка",
                description="Сказочный мир: волшебная атмосфера, мягкое свечение, красивый свет, много деталей, лёгкая дымка.",
                bg="#0b1220",
                accent="#a78bfa",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="space",
                category=cat_worlds,
                name="Космос",
                preview_text="Космос",
                description="Космос: звёзды, туманности, холодный свет, глубокий фон, ощущение масштаба, много деталей.",
                bg="#050816",
                accent="#38bdf8",
                icon="rocket",
                pattern="dots",
            ),
            _style(
                id="underwater",
                category=cat_worlds,
                name="Подводный мир",
                preview_text="Под водой",
                description="Подводный мир: мягкие лучи света сквозь воду, пузырьки, плавные формы, прохладные цвета, ощущение глубины.",
                bg="#061826",
                accent="#22c55e",
                icon="leaf",
                pattern="dots",
            ),
            _style(
                id="postapocalypse",
                category=cat_worlds,
                name="Постапокалипсис",
                preview_text="После…",
                description="Постапокалипсис: пыль, разрушенные детали, ржавчина, тусклый свет, драматичное настроение, много фактуры.",
                bg="#0a0a0a",
                accent="#a16207",
                icon="mountain",
                pattern="paper",
            ),
            _style(
                id="robots",
                category=cat_worlds,
                name="Роботы",
                preview_text="Роботы",
                description="Роботы: металл, подсветка, аккуратные детали, отражения, технологичное настроение.",
                bg="#0b1020",
                accent="#60a5fa",
                icon="robot",
                pattern="grid",
            ),
            _style(
                id="nature_autumn",
                category=cat_nature,
                name="Тёплая осень",
                preview_text="Осень",
                description="Тёплая осень: золотые листья, мягкий солнечный свет, тёплая палитра, уютные детали.",
                bg="#1b1a16",
                accent="#f59e0b",
                icon="leaf",
                pattern="dots",
            ),
            _style(
                id="nature_winter",
                category=cat_nature,
                name="Зимнее утро",
                preview_text="Зима",
                description="Зимнее утро: снег, чистый холодный свет, лёгкий туман, спокойные цвета, свежесть.",
                bg="#0b1220",
                accent="#93c5fd",
                icon="snow",
                pattern="dots",
            ),
            _style(
                id="nature_spring",
                category=cat_nature,
                name="Весна",
                preview_text="Весна",
                description="Весна: свежие цвета, мягкий свет, цветы и зелень, лёгкость и чистота.",
                bg="#0b1220",
                accent="#22c55e",
                icon="leaf",
                pattern="confetti",
            ),
            _style(
                id="nature_summer",
                category=cat_nature,
                name="Лето",
                preview_text="Лето",
                description="Лето: яркое солнце, насыщенные цвета, лёгкие тени, ощущение тепла и воздуха.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="leaf",
                pattern="confetti",
            ),
            _style(
                id="sunset",
                category=cat_nature,
                name="Закат",
                preview_text="Закат",
                description="Закат: тёплый свет, длинные тени, мягкое небо, красивый контраст, спокойное настроение.",
                bg="#0b1220",
                accent="#fb7185",
                icon="mountain",
                pattern="stripes",
            ),
            _style(
                id="fog",
                category=cat_nature,
                name="Туман",
                preview_text="Туман",
                description="Туман: мягкие контуры, рассеянный свет, спокойные цвета, ощущение глубины и воздуха.",
                bg="#0b1020",
                accent="#e5e7eb",
                icon="mountain",
                pattern="dots",
            ),
            _style(
                id="mountains",
                category=cat_nature,
                name="Горы",
                preview_text="Горы",
                description="Горы: масштаб, чистый воздух, выразительный свет, детали рельефа, спокойные цвета.",
                bg="#0b1220",
                accent="#60a5fa",
                icon="mountain",
                pattern="grid",
            ),
            _style(
                id="ocean",
                category=cat_nature,
                name="Море",
                preview_text="Море",
                description="Море: свет на воде, блики, свежие цвета, лёгкая дымка, простор.",
                bg="#061826",
                accent="#38bdf8",
                icon="leaf",
                pattern="dots",
            ),
            _style(
                id="product",
                category=cat_design,
                name="Фото товара",
                preview_text="Товар",
                description="Фото товара: чистый фон, мягкий свет, аккуратные тени, внимание к материалам и форме.",
                bg="#0b1220",
                accent="#60a5fa",
                icon="camera",
                pattern="grid",
            ),
            _style(
                id="sticker",
                category=cat_design,
                name="Наклейки",
                preview_text="Наклейки",
                description="Наклейки: простые формы, чистые контуры, яркие цвета, аккуратная тень от наклейки.",
                bg="#0b1220",
                accent="#fbbf24",
                icon="spark",
                pattern="confetti",
            ),
            _style(
                id="icons",
                category=cat_design,
                name="Иконки",
                preview_text="Иконки",
                description="Иконки: простые формы, единый стиль, чистый контур, аккуратные тени, читабельность.",
                bg="#0b1220",
                accent="#38bdf8",
                icon="spark",
                pattern="grid",
            ),
            _style(
                id="poster",
                category=cat_design,
                name="Плакат",
                preview_text="Плакат",
                description="Плакат: крупные формы, читаемая композиция, контраст, минимум лишнего, выразительная подача.",
                bg="#0b1220",
                accent="#f97316",
                icon="postcard",
                pattern="stripes",
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
