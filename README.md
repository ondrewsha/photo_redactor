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

## Prompt Service (Step 2)

Поднять сервис B локально через Docker:

```bash
docker compose up -d prompt_service
```

Эндпоинты:

- `GET /health`
- `GET /categories` — безопасный список стилей (без hidden prompt частей)
- `POST /compose` — сборка промпта (enhance/creative) + скрытые префикс/суффикс

## API Gateway (Service A)

Поднять gateway локально через Docker:

```bash
docker compose up -d gateway
```

Эндпоинты (единая точка входа для фронта):

- `GET /categories`
- `POST /generate` — скрывает финальный промпт от клиента
- `GET /jobs/{job_id}`
- `GET /media/{file}`

Gateway добавляет `x-request-id` в ответы (удобно для трассировки). Для подробных `details` в ошибках включи `GATEWAY_DEBUG_ERRORS=true`.

## Generation Service (Step 3)

Поднять сервис C локально через Docker:

```bash
docker compose up -d generation_service
```

По умолчанию `GEN_SERVICE_DATABASE_URL` собирается из `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` (можно переопределить явным `GEN_SERVICE_DATABASE_URL` в `.env`).

Эндпоинты:

- `POST /jobs` — создать задачу генерации (кладёт job в Redis-очередь)
- `GET /jobs/{job_id}` — polling статуса (pending/processing/completed/failed)
- `GET /media/{file}` — локальная раздача результата (dev-режим)

### Оптимизация изображений (Step 5)

По умолчанию сервис сохраняет результат как `webp` и ограничивает длинную сторону до `1280` (настраивается через env):

- `GEN_SERVICE_OUTPUT_FORMAT` = `webp|png|jpeg`
- `GEN_SERVICE_OUTPUT_QUALITY` = `1..100`
- `GEN_SERVICE_OUTPUT_MAX_SIDE` = `0` (выкл) или число пикселей

## Frontend (Step 4)

```bash
docker compose up -d gateway
cd frontend
cp .env.example .env
npm install
npm run dev
```
