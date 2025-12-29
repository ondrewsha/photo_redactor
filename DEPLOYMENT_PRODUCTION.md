# Развёртывание NanoVisual в продакшене

## 1. Подготовка сервера

- Поднимите свежую Ubuntu (22.04+ или аналог) с минимум 2 vCPU и 4 ГБ RAM.
- Откройте порты 80/443/800x, 6379, 5432, 27017 только для доверенных источников в `ufw` или через облачный firewall.
- Установите Docker 24+ и Docker Compose v2 (`docker compose --version`).
- Настройте хостнейм, убедитесь, что доменное имя (`nanovisual.example`) уже указывает на IP сервера.

## 2. Секреты и окружение

- Создайте директорию `/etc/nanovisual` и положите туда `.env` файл — внешнее приложение ожидает переменные (пример описан в `.env.example`). Обязательно:
  - `PGUSER`/`PGPASSWORD` совпадают с PostgreSQL.
  - `MONGO_INITDB_ROOT_USERNAME`/`MONGO_INITDB_ROOT_PASSWORD` и `GATEWAY_MONGO_URL` используют безопасные пароли.
  - `OPENAI_API_KEY`, `GEMINI_API_KEY` и `YOOKASSA_*` по необходимости.
  - `VITE_GATEWAY_URL` указывает на `https://nanovisual.example/api`.
  - `GATEWAY_PUBLIC_BASE_URL`/`GATEWAY_FRONTEND_BASE_URL` содержат `https://nanovisual.example`.

## 3. Стек

- Запускаются 6 сервисов: `gateway`, `prompt_service`, `generation_service`, `frontend`, `postgres`, `redis`, `mongo`.
- В `docker-compose.yml` используется `frontend` на порту 5173 (dev) и nginx проксирует `/api/*` к `gateway`.
- Для продакшена собирайте frontend через `docker compose run frontend npm run build` и используйте nginx (см. `frontend/nginx.conf`) чтобы отдавать статику и проксировать `/api` к `gateway`.

## 4. Настройка сертификатов

1. Установите nginx: `sudo apt install nginx certbot python3-certbot-nginx`.
2. В конфиге `/etc/nginx/sites-available/nanovisual`:
   - Пробросьте `/api` на `http://127.0.0.1:8000`.
   - Статику отдавайте из `frontend/dist`.
3. Активируйте сайт и перезапустите nginx.
4. Получите сертификат: `sudo certbot --nginx -d nanovisual.example`.
5. Настройте автоматическое обновление `certbot renew --dry-run` (systemd timer уже создаётся).

## 5. Запуск через Docker Compose

1. Клонируйте репозиторий и перейдите в корень проекта.
2. Скопируйте `.env.example` в `.env` и заполните секреты.
3. Запустите `docker compose pull` → `docker compose up -d --build`.
4. Проверьте логи: `docker compose logs gateway -f`.
5. Убедитесь, что `gateway` отвечает по HTTPS на `/categories`, `/billing/history`.

## 6. Базы данных

- PostgreSQL: данные сохраняются на том же сервере — при необходимости настройте volume (`postgres_data`).
- Redis: используется для rate-limit/очередей. Для продакшена обязательно добавьте пароль (`REDIS_PASSWORD`) и настройте `redis.conf`.
- MongoDB: хранит историю. В `.env` укажите `GATEWAY_MONGO_URL` вида `mongodb://<user>:<pass>@mongo:27017/nanovisual`.

## 7. Обновление

- Перед обновлением остановите: `docker compose down`.
- Перезалейте образа `git pull && docker compose pull && docker compose up -d --build`.
- После `npm run build` фронт лежит в `frontend/dist`, nginx отдаёт его.

## 8. Мониторинг и бэкап

- Настройте `pg_dump` и `mongodump` по расписанию (`cron`) на отдельный диск.
- Логи `gateway`/`frontend` можно собрать через `docker compose logs`.
- Следите за `redis` памятью и `docker system prune` раз в неделю.

## 9. Тревожные сигналы

- `gateway` не стартует → проверьте переменные и соединения с Postgres/Mongo/Redis.
- Ошибки SSL → убедитесь, что `certbot` получил сертификаты и nginx перезапущен.
- Тёмная тема на фронте отличается? Проверьте `VITE_THEME` (если введена).

