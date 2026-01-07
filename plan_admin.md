## План переноса админки в `frontend-admin`

1. **Синхронизация компонентов**
   - [x] перенести компоненты из `frontend/components/admin` (AdminPanel, AdminUserTable, AdminBillingTable, AdminJobsTable, MetricsPanel) в `frontend-admin/src/components` (используя Ant Design), адаптируя стили и импортируемые утилиты.
   - [x] сопроводить переводами и схемами типов: обновить `frontend-admin/src/api/admin`/`types` (если есть) или создать новые определения, соответствующие существующим `schemas` в gateway.

2. **API и запросы**
   - [x] адаптировать `adminApi` в `frontend-admin/src/api` (или создать новый) так, чтобы он использовал `VITE_API_BASE` и делал запросы к `/admin/users`, `/admin/transactions`, `/admin/jobs`, `/admin/metrics` с необходимым `X-Admin-Action`.
   - [x] позаботиться об авторизации/CSRF (реиспользовать куки из пользовательского фронта или дописать fetch с `credentials: include`).

3. **Интеграция с Docker**
   - [x] удостовериться, что Dockerfile/compose для `frontend-admin` строит пересобранный UI с новыми компонентами и что контейнер `admin` в `docker-compose.yml` использует его (`npm run build` в `frontend-admin` завершился успешно).
   - [x] проверить `.env` (`ADMIN_PORT`, `VITE_API_BASE`) и убрать `VITE_FEATURE_ADMIN_UI` из основного `.env`.

4. **Тестирование**
   - [ ] поднять оба фронта (`frontend` + `frontend-admin`) локально, убедиться, что личный кабинет не затрагивается, а админка загружается по своему порту с новыми табами и API (доки/README уже описывают команды).
   - [ ] сделать минимальный smoke-тест для `/admin/users` и `/admin/jobs`.

5. **Финализация**
   - [x] удалить повторяющийся код, неиспользуемые файлы из `frontend` (админские компоненты/локали) или корректно задокументировать их в пользу новой папки.
   - [x] задокументировать процесс запуска обоих фронтов (README/dockers) и обновить `plan.md`/`plan_admin.md` по прогрессу.
