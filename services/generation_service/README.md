# Service C — Generation Engine

Очередь задач (Redis), адаптер к Gemini Nano Banana, сохранение метаданных (Postgres) и результата в хранилище.

## Output optimization (Step 5)

По умолчанию результат конвертируется в `webp` (качество `85`) и ограничивается по длинной стороне до `1280`.
Настройки: `GEN_SERVICE_OUTPUT_FORMAT`, `GEN_SERVICE_OUTPUT_QUALITY`, `GEN_SERVICE_OUTPUT_MAX_SIDE`, `GEN_SERVICE_OUTPUT_ENABLED`.
