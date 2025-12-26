# Frontend (Step 4)

Стек: React 19 + Vite + TypeScript.

## Dev запуск

1) Подними бэкенд (если ещё не запущен):

```bash
docker compose up -d postgres redis prompt_service generation_service gateway
```

2) Скопируй env в папке `frontend/`:

```bash
cp .env.example .env
```

3) Установи зависимости и запусти dev-сервер:

```bash
npm install
npm run dev
```

Фронт слушает `http://localhost:5173` и проксирует:

- `/api/*` → API Gateway (`http://localhost:8080`)

## Сборка

```bash
npm run build
```

или

```bash
npm run preview
```
