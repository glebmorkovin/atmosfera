# Архитектура MVP «Атмосфера»

## Монорепозиторий
- `apps/web` — Next.js 14 (App Router, TS). Публичный лендинг, auth-страницы, кабинеты (игрок/скаут/админ) с реальной загрузкой.
- `apps/api` — NestJS + Prisma + PostgreSQL. Модули `auth`, `users`, `players`, `shortlists`, `search-filters`, `notifications`, `profile-views`, `notes`, `admin`, `media`.
- `prisma/schema.prisma` — модель данных (users, players, parents, clubs, leagues, seasons, stats, media, shortlists, notes, views, notifications, audit).

## Фронтенд (web)
- Публичные страницы: `/` (лендинг), `/auth/login`, `/auth/register`, `/auth/reset`.
- Кабинеты/превью: `/player/dashboard`, `/player/profile`, `/player/stats`, `/player/media`; `/scout` + `/scout/search`, `/scout/shortlists` (+ детали `/scout/shortlists/[id]`), `/scout/filters`, `/scout/notes`; `/admin` + `/admin/players`, `/admin/media`, `/admin/refs`, `/admin/audit`; глобальные `/notifications`.
- Стиль: Tailwind, адаптивный, тёмная тема.
- API-клиент `lib/api-client.ts` с auto-refresh (использовать `apiFetch`).

## Бэкенд (api)
- Глобальный префикс `api`.
- Auth: регистрация/логин, refresh/logout, reset password, RBAC (PLAYER/PARENT/SCOUT/AGENT/ADMIN).
- Users: `GET /users/me`.
- Players: `GET /players`, `GET /players/:id`, `GET /players/search` (фильтры+пагинация), `POST /players/:id/view`, `PUT /players/:id` (редактирование профиля), CRUD стат-линий `POST /players/:id/stats`, `PUT/DELETE /players/stats/:statId`, CRUD истории клубов `POST /players/:id/history`, `PUT/DELETE /players/history/:historyId`, CRUD достижений `POST /players/:id/achievements`, `PUT/DELETE /players/achievements/:achievementId`.
- Profile views: `/profile-views/:playerId/stats` (7/30/90).
- Shortlists: список/детали, create, add/remove player, экспорт CSV/XLSX; уведомление владельцу игрока при добавлении в шортлист.
- Saved filters: CRUD (создание/удаление, применение в поиске).
- Notes: заметки по игроку/шортлисту (только владелец).
- Notifications: список, mark-read, mark-all.
- Media: create, set main, delete.
- Refs: публичные справочники клубов/лиг/сезонов (`/refs/clubs`, `/refs/leagues`, `/refs/seasons`) для выборов в формах. CLI импорт: `npm run import:refs --workspace api -- --file apps/api/scripts/sample-refs.json`.
- Импорт игроков/статистики из JSON: `npm run import:players --workspace api -- --file apps/api/scripts/sample-players.json`.
- Admin: смена роли/статуса пользователя, модерация профилей/медиа, CRUD лиг/клубов/сезонов, аудит-лог.
- Валидация `class-validator`, Prisma через `PrismaService`.

## Приватность и роли (план)
- Роли: guest, player, parent, scout/club, agent, admin (enum `UserRole`).
- Приватность профиля: `isPublicInSearch`, `showContactsToScoutsOnly`.
- Админ-модерация: статусы профилей и медиа (можно расширить схемой).

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
- Дополнить фронт: медиа/достижения/история для игрока, индикатор уведомлений, XLSX экспорт шортлистов.
- Доработать UI шортлистов (заметки в списке, действия), админ-UI фильтры/действия.
- E2E/интеграционные тесты и CI.
