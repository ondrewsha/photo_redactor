# Frontend (Step 4)

Стек: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion.

## Dev запуск

0) Подними бэкенд (если ещё не запущен):

```bash
docker compose up -d postgres redis prompt_service generation_service gateway
```

1) Скопируй env (нужно для Vite proxy):

```bash
cp .env.example .env
```

2) Установи зависимости и запусти dev-сервер:

```bash
npm install
npm run dev
```

По умолчанию фронт работает на `http://localhost:5173` и проксирует:

- `/api/*` → API Gateway (`http://localhost:8000`)
