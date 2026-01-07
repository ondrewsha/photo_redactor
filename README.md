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
frontend/                     # React/Vite/Tailwind
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
- `POST /compose` — улучшение текста + аккуратное «вплетение» выбранных стилей (внутренний эндпоинт, фронту финальный промпт не нужен)

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

### Авторизация и доступ к генерации

- Генерация доступна только после входа и подтверждения почты (`email_verified=true`).
- Вход — JWT в httpOnly-cookie, а для POST-операций используется CSRF-токен (фронт проставляет сам).
- Покупка — пакеты генераций `1..1000` (по умолчанию mock-провайдер, подготовлена интеграция YooKassa).

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

### Production (Docker)

```bash
docker compose up --build -d frontend
```

Фронтенд будет доступен по `http://localhost:${FRONTEND_PORT:-5173}`; переменная `VITE_GATEWAY_URL` используется при сборке и может быть настроена через `.env`, чтобы указывать на нужный gateway.

### Локализация стилей и размеров

Файлы в `frontend/locales/*.ts` подсоединяют словари из `frontend/locales/styleNames.ts`. Если добавляешь новый язык или обновляешь названия стилей/размеров, дополни соответствующие `XXStyleNames`/`XXSizeLabels` и убедись, что перевод подключён в `frontend/locales/index.ts`.


## Админка (Step 5)

Админский интерфейс вынесен в `frontend-admin` и работает как отдельный сервис на `ADMIN_PORT` (по умолчанию `5174`). Он подхватывает `VITE_API_BASE` и делает `fetch`/`POST` к

```
/admin/users
/admin/transactions
/admin/jobs
/admin/metrics
```

используя HTTP-only куки из gateway (включено `credentials: 'include'`). Для локальной разработки:

```bash
cd frontend-admin
cp .env.example .env
npm install
npm run dev
```

в `frontend-admin/.env` указывай `VITE_API_BASE=http://localhost:8080`, а затем админка будет доступна по `http://localhost:5174`. Для Docker-сборки:

```bash
docker compose up --build -d admin
```

Контейнер `admin` берёт собранный `frontend-admin/dist` и проксирует nginx, поэтому гарантируй, что `ADMIN_PORT` и `VITE_API_BASE` прописаны в корневом `.env`, а `docker-compose.yml` поднимает gateway перед админкой. Также удостоверься, что админский UI запускается автономно от основного фронтенда, чтобы личный кабинет остался изолирован.
