# ИС «Атмосфера»

Монорепозиторий веб-приложения для цифровых профилей хоккеистов, шортлистов, запросов на сотрудничество, рабочих карточек, вакансий и админ-модерации.

## Стек
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind.
- Backend: NestJS + TypeScript + Prisma + PostgreSQL, REST API.
- Auth: email+пароль, JWT (access+refresh), RBAC (PLAYER, PARENT, SCOUT, CLUB, ADMIN).

## Структура
- `apps/web` — фронтенд.
- `apps/api` — backend.
- `prisma/schema.prisma` — модель данных (пользователи, игроки, родители, лиги/клубы/сезоны, статы, медиа, шортлисты, запросы, рабочие карточки, вакансии, уведомления, аудит).
- `docs/ARCHITECTURE.md` — архитектура и шаги запуска.

## Быстрый старт (локально)
```bash
cp .env.example .env          # заполните DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_BASE_URL
docker-compose up -d db       # поднимаем Postgres локально
npx prisma migrate dev --name init
npx prisma db seed            # тестовые пользователи/игроки/статы/шортлист/уведомления
npm run import:refs --workspace api -- --file apps/api/scripts/sample-refs.json      # опционально подгрузить лиги/клубы/сезоны
npm run import:players --workspace api -- --file apps/api/scripts/sample-players.json # опционально подгрузить игроков/статы
npm run dev:api               # API на 3001
npm run dev:web               # Web на 3000
```

Тестовые логины (пароль `password123`): `player@example.com`, `parent@example.com`, `scout@example.com`, `club@example.com`, `admin@example.com`.

## Прод/деплой (минимум)
- Заполните `.env` (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_BASE_URL, PORT для api/web при необходимости).
- Соберите образы или запустите `docker-compose up -d db` и затем `npm run build --workspace api && npm run build --workspace web`.
- Выполните миграции/сид: `npx prisma migrate deploy`, при необходимости `npx prisma db seed`, `npm run import:refs --workspace api ...`, `npm run import:players --workspace api ...`.
- Демо-логины для прод/стейдж: `npm run seed:demo --workspace api` или `SEED_DEMO_USERS=true` при старте API (идемпотентно).
- Запустите API (`node dist/main.js` из `apps/api`) и Web (`next start` из `apps/web`) за reverse-proxy/SSL.

## Render (API)
- Build Command: `npm run build --workspace api`
- Start Command: `npm run migrate:deploy --workspace api && npm run start:prod --workspace api`

## Vercel (фронтенд)
- В корне добавлен `vercel.json`, который собирает Next.js из `apps/web` через `@vercel/next` (root проекта можно не менять в настройках Vercel).
- Перед деплоем задайте переменные: `NEXT_PUBLIC_API_BASE_URL=https://<ваш-api>/api` для фронта и `CORS_ORIGINS=https://<your-app>.vercel.app,...` для API.
- Подключите репозиторий в Vercel, включите `npm` (lock-файл в корне) и запустите билд; локально проверка: `npm run build --workspace web && npm run start --workspace web`.
- API на Vercel не поднимается — разместите бэкенд отдельно (Render/Fly/другое) и прокиньте его URL во фронт.

## Основные эндпоинты API (коротко)
- Auth: регистрация/логин/refresh/reset/logout.
- Users: `GET /users/me`.
- Players: поиск/деталь, фиксация просмотра, редактирование профиля, CRUD статистики, истории, достижений, медиа.
- Profile Views: `/profile-views/:playerId/stats`.
- Shortlists: CRUD + add/remove player, meta, экспорт `GET /shortlists/:id/export?format=csv|xlsx`.
- Engagement Requests: `/engagement-requests/*` (inbox/outbox, accept/decline, cancel).
- Working Cards: `/working-cards/*` (list/detail/update, sync-preview/sync-apply).
- Vacancies:
  - Public: `GET /vacancies`, `GET /vacancies/:id`
  - Club: `/club/vacancies/*`, `/club/applications/*`
  - Player/Parent: `/vacancies/:id/applications`, `/player/applications`, `/parent/applications`
- Saved Filters: CRUD.
- Notes: CRUD заметок по игрокам/шортлистам.
- Notifications: список, mark-read, mark-all.
- Refs: `/refs/clubs|leagues|seasons` для выборов в формах.
- Admin: пользователи (роли/статусы), модерация профилей/медиа, вакансий, CRUD справочников, аудит.

## Фронтенд
- Публичные страницы: `/`, `/vacancies`, `/vacancies/:id`, `/auth/login`, `/auth/register`, `/auth/reset`.
- Игрок: `/app/player/dashboard`, `/app/player/profile`, `/app/player/profile/edit`, `/app/player/stats`, `/app/player/media`, `/app/player/requests`, `/app/player/applications`, `/app/player/settings`.
- Родитель: `/app/parent/dashboard`, `/app/parent/children`, `/app/parent/requests`, `/app/parent/applications`, `/app/parent/settings`.
- Скаут: `/app/scout/dashboard`, `/app/scout/search`, `/app/scout/shortlists`, `/app/scout/shortlists/[id]`, `/app/scout/working`, `/app/scout/working/[id]`, `/app/scout/requests`, `/app/scout/settings`.
- Клуб: `/app/club/dashboard`, `/app/club/search`, `/app/club/shortlists`, `/app/club/shortlists/[id]`, `/app/club/working`, `/app/club/working/[id]`, `/app/club/requests`, `/app/club/vacancies`, `/app/club/vacancies/new`, `/app/club/vacancies/[id]`, `/app/club/vacancies/[id]/edit`, `/app/club/vacancies/[id]/applications`, `/app/club/settings`.
- Админ: `/admin/dashboard`, `/admin/vacancies`, `/admin/vacancies/[id]`, `/admin/players`, `/admin/media`, `/admin/refs`, `/admin/audit`.
- Глобальные уведомления: `/notifications` (не для ADMIN).
- API-клиент с auto-refresh токена: `apps/web/lib/api-client.ts` (`apiFetch`).

## Дополнительно
- CLI импорт: `npm run import:refs --workspace api -- --file apps/api/scripts/sample-refs.json`, `npm run import:players --workspace api -- --file apps/api/scripts/sample-players.json`.
- Экспорт шортлистов: CSV/XLSX из `/scout/shortlists/[id]`.
- Индикатор уведомлений на клиенте, автообновление каждые 30 секунд.
