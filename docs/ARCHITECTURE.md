# Архитектура MVP «Атмосфера»

## Монорепозиторий
- `apps/web` — Next.js 14 (App Router, TS). Публичный лендинг, auth-страницы, кабинеты (player/parent/scout/club/admin) с реальной загрузкой.
- `apps/api` — NestJS + Prisma + PostgreSQL. Модули `auth`, `users`, `players`, `shortlists`, `search-filters`, `notifications`, `profile-views`, `notes`, `engagement-requests`, `working-cards`, `vacancies`, `admin`, `media`.
- `prisma/schema.prisma` — модель данных (users, players, parents, clubs, leagues, seasons, stats, media, shortlists, engagement, working cards, vacancies, notifications, audit).

## Фронтенд (web)
- Публичные страницы: `/`, `/vacancies`, `/vacancies/:id`, `/auth/login`, `/auth/register`, `/auth/reset`.
- Кабинеты:
  - Player: `/app/player/dashboard`, `/app/player/profile`, `/app/player/profile/edit`, `/app/player/stats`, `/app/player/media`, `/app/player/requests`, `/app/player/applications`, `/app/player/settings`.
  - Parent: `/app/parent/dashboard`, `/app/parent/children`, `/app/parent/requests`, `/app/parent/applications`, `/app/parent/settings`.
  - Scout: `/app/scout/dashboard`, `/app/scout/search`, `/app/scout/shortlists`, `/app/scout/shortlists/[id]`, `/app/scout/working`, `/app/scout/working/[id]`, `/app/scout/requests`, `/app/scout/settings`.
  - Club: `/app/club/dashboard`, `/app/club/search`, `/app/club/shortlists`, `/app/club/shortlists/[id]`, `/app/club/working`, `/app/club/working/[id]`, `/app/club/requests`, `/app/club/vacancies`, `/app/club/vacancies/new`, `/app/club/vacancies/[id]`, `/app/club/vacancies/[id]/edit`, `/app/club/vacancies/[id]/applications`, `/app/club/settings`.
  - Admin: `/admin/dashboard`, `/admin/vacancies`, `/admin/vacancies/[id]`, `/admin/players`, `/admin/media`, `/admin/refs`, `/admin/audit`.
- Глобальные уведомления: `/notifications` (не доступно ADMIN).
- Стиль: Tailwind + CSS tokens, dark-first, hairline borders.
- API-клиент `lib/api-client.ts` с auto-refresh (использовать `apiFetch`).

## Бэкенд (api)
- Глобальный префикс `api`.
- Auth: регистрация/логин, refresh/logout, reset password, RBAC (PLAYER/PARENT/SCOUT/CLUB/ADMIN).
- Users: `GET /users/me`.
- Players: `GET /players`, `GET /players/:id`, `GET /players/search` (фильтры+пагинация), `POST /players/:id/view`, `PUT /players/:id` (редактирование профиля), CRUD стат-линий `POST /players/:id/stats`, `PUT/DELETE /players/stats/:statId`, CRUD истории клубов `POST /players/:id/history`, `PUT/DELETE /players/history/:historyId`, CRUD достижений `POST /players/:id/achievements`, `PUT/DELETE /players/achievements/:achievementId`.
- Profile views: `/profile-views/:playerId/stats` (7/30/90).
- Shortlists: список/детали, create, add/remove player, meta, экспорт CSV/XLSX; уведомление владельцу игрока при добавлении в шортлист.
- Engagement requests: inbox/outbox, accept/decline/cancel, 409 на повторный pending.
- Working cards: список/деталь, update, sync-preview/sync-apply.
- Vacancies: публичные `/vacancies/*`, клубные `/club/vacancies/*`, отклики `/club/applications/*`, player/parent `/player|parent/applications`.
- Saved filters: CRUD (создание/удаление, применение в поиске).
- Notes: заметки по игроку/шортлисту (только владелец).
- Notifications: список, mark-read, mark-all.
- Media: create, set main, delete.
- Refs: публичные справочники клубов/лиг/сезонов (`/refs/clubs`, `/refs/leagues`, `/refs/seasons`) для выборов в формах. CLI импорт: `npm run import:refs --workspace api -- --file apps/api/scripts/sample-refs.json`.
- Импорт игроков/статистики из JSON: `npm run import:players --workspace api -- --file apps/api/scripts/sample-players.json`.
- Admin: смена роли/статуса пользователя, модерация профилей/медиа/вакансий, CRUD лиг/клубов/сезонов, аудит-лог.
- Валидация `class-validator`, Prisma через `PrismaService`.

## Приватность и роли
- Роли: PLAYER, PARENT, SCOUT, CLUB, ADMIN.
- Приватность профиля и агентской карточки: скрытие контактов/контракта до engagement.
- Админ-модерация: статусы профилей, медиа и вакансий + аудит.

## Запуск (локально)
```bash
npm install
cp .env.example .env   # заполнить DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_BASE_URL
docker-compose up -d db
npx prisma migrate dev --name init
npx prisma db seed
npm run dev:api        # порт 3001
npm run dev:web        # порт 3000
```

## Дальнейшие шаги
- E2E/интеграционные тесты и CI.
- Расширение XLSX экспорта и публичной витрины вакансий (фильтры).
