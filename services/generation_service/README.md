# Service C — Generation Engine

Очередь задач (Redis), адаптеры к генераторам изображений (Gemini/OpenAI), сохранение метаданных (Postgres) и результата в хранилище.

Провайдер выбирается через `GEN_SERVICE_IMAGE_PROVIDER`:
- `gemini` (SDK `google-genai`)
- `openai` (SDK `openai`, Images API)
- `mock` (dev-заглушка)

Модели из документации Nano Banana:
- `gemini-2.5-flash-image`
- `gemini-3-pro-image-preview`

Imagen модели (text-to-image):
- `imagen-4.0-generate-001`
- `imagen-4.0-ultra-generate-001`
- `imagen-4.0-fast-generate-001`

Примечание: модели `imagen-*` принимают только текстовый prompt (без исходных изображений).
Примечание: Imagen может требовать включённый биллинг (ошибка `Imagen API is only accessible to billed users`).

OpenAI модель по умолчанию: `gpt-image-1` (`GEN_SERVICE_OPENAI_MODEL`).

## Output optimization (Step 5)

По умолчанию результат конвертируется в `webp` (качество `85`) и ограничивается по длинной стороне до `1280`.
Настройки: `GEN_SERVICE_OUTPUT_FORMAT`, `GEN_SERVICE_OUTPUT_QUALITY`, `GEN_SERVICE_OUTPUT_MAX_SIDE`, `GEN_SERVICE_OUTPUT_ENABLED`.
