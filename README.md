# NanoVisual — AI Image Generator (Microservices)

Цель: дать непрофессионалам UX с пресетами стилей и «скрытой инженерией» — пользователь выбирает стиль и вводит текст, а система за кадром улучшает запрос через LLM и генерирует изображение.

## Структура репозитория

```
docker-compose.yml            # Инфраструктура (Postgres, Redis)
services/
  gateway/                    # Service A: API Gateway (FastAPI)
  prompt_service/             # Service B: Prompt & AI Intelligence (FastAPI)
  generation_service/         # Service C: Generation Engine (FastAPI + очередь)
shared/                       # Общие Pydantic-схемы (Pydantic v2)
frontend/                     # React/Vite/Tailwind (будет добавлено на шаге 4)
```

## Быстрый старт (инфраструктура)

1) Создай `.env` на основе примера:

```bash
cp .env.example .env
```

2) Подними Postgres и Redis:

```bash
docker compose up -d postgres redis
```
