# Service A — API Gateway

Единая точка входа для фронтенда: оркестрирует `prompt_service` + `generation_service`, делает CORS и базовую безопасность.

## API

- `GET /health`
- `GET /categories` — список стилей (без hidden частей)
- `POST /generate` — принимает user input + стиль, вызывает LLM и создаёт job (не возвращает финальный промпт)
- `GET /jobs/{job_id}` — polling статуса
- `GET /media/{file}` — прокси на generation_service media
