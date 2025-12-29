# Production-ready checklist

## Production URLs
- WEB: https://atmosfera-web.vercel.app
- API: https://atmosfera-api.onrender.com

## Авто-проверки (CI)
- GitHub Actions: https://github.com/glebmorkovin/atmosfera/actions?query=branch%3Amain
- Команды:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build --workspace api`
  - `npm run build --workspace web`
  - `npx prisma validate`
  - `npm run test`
  - `npm run prod-smoke` (production)

## Prod-smoke (production)
```bash
npm run prod-smoke
```
Примечание: сценарии создают тестовые вакансии и отклики (используется уникальный заголовок).

## Ручные smoke-сценарии (DoD)
1) SCOUT
   - Войти → открыть `/app/scout/search` → открыть профиль игрока → отправить запрос → проверить `/app/scout/requests`.
2) PLAYER / PARENT
   - Войти → открыть inbox `/app/player/requests` или `/app/parent/requests` → принять запрос → проверить, что у скаута появилась WorkingCard.
3) CLUB → Vacancy → Admin → Public → Player
   - CLUB создаёт вакансию → отправляет на модерацию → ADMIN одобряет → в `/vacancies` видно публикацию → PLAYER откликается → CLUB меняет статус отклика.
4) ADMIN
   - Одобрить/отклонить вакансию → проверить `/admin/audit` → выйти (logout).

## Быстрые проверки
- `/demo` и `/demo/*` дают 404 (production).
- `/vacancies/:id` отдаёт 200 для опубликованных вакансий.
- `/api/health` возвращает `db`, `version`, `commitSha`.

## CSP / headers
- Минимальные headers включены: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- CSP пока не включён. Для включения позже:
  1) Добавить `Content-Security-Policy-Report-Only` (или `Content-Security-Policy`) в web headers.
  2) Принять отчёты на API и логировать.
