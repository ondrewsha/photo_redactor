# Service A — API Gateway

Единая точка входа для фронтенда: оркестрирует `prompt_service` + `generation_service`, делает CORS и базовую безопасность.

## API

- `GET /health`
- `GET /categories` — список стилей (без hidden частей)
- `POST /generate` — создаёт задачу генерации (требует вход + подтверждённую почту, списывает 1 генерацию)
- `POST /generate/image` — генерация с фото (до 4 файлов)
- `GET /jobs/{job_id}` — polling статуса (доступ только владельцу)
- `GET /media/{file}` — прокси на generation_service media (доступ только владельцу)

### Авторизация (JWT в httpOnly-cookie)

- `POST /auth/register` — регистрация по почте+паролю, отправляет письмо для подтверждения
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me` — профиль (email, email_verified, balance)
- `POST /auth/resend-verification`
- `GET /auth/verify-email` — подтверждение из письма (редирект на фронт)
- `POST /auth/change-password` — требует CSRF

### Покупка генераций

- `GET /billing/quote?count=...` — расчёт цены для пакета 1..1000
- `POST /billing/pay` — создать платёж (требует CSRF)
- `GET /billing/mock/confirm?payment_id=...` — подтверждение для mock-провайдера (dev)
- `POST /billing/webhook/yookassa` — webhook для YooKassa (когда включишь `GATEWAY_PAYMENT_PROVIDER=yookassa`)
