# ИС «Атмосфера»

Монорепозиторий веб-приложения для цифровых профилей хоккеистов, поиска скаутами, шортлистов и админ-модерации.

## Стек
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind.
- Backend: NestJS + TypeScript + Prisma + PostgreSQL, REST API.
- Auth: email+пароль, JWT (access+refresh), RBAC (PLAYER, PARENT, SCOUT, AGENT, ADMIN).

## Структура
- `apps/web` — фронтенд.
- `apps/api` — backend.
- `prisma/schema.prisma` — модель данных (пользователи, игроки, родители, лиги/клубы/сезоны, статы, медиа, шортлисты, заметки, уведомления, аудит).
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

Тестовые логины (пароль `password123`): `player@example.com`, `parent@example.com`, `scout@example.com`, `admin@example.com`.

## Прод/деплой (минимум)
- Заполните `.env` (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_BASE_URL, PORT для api/web при необходимости).
- Соберите образы или запустите `docker-compose up -d db` и затем `npm run build --workspace api && npm run build --workspace web`.
- Выполните миграции/сид: `npx prisma migrate deploy`, при необходимости `npx prisma db seed`, `npm run import:refs --workspace api ...`, `npm run import:players --workspace api ...`.
- Запустите API (`node dist/main.js` из `apps/api`) и Web (`next start` из `apps/web`) за reverse-proxy/SSL.

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
- Shortlists: CRUD + add/remove player, экспорт `GET /shortlists/:id/export?format=csv|xlsx`.
- Saved Filters: CRUD.
- Notes: CRUD заметок по игрокам/шортлистам.
- Notifications: список, mark-read, mark-all.
- Refs: `/refs/clubs|leagues|seasons` для выборов в формах.
- Admin: пользователи (роли/статусы), модерация профилей/медиа, CRUD справочников, аудит.

## Фронтенд
- Лендинг и auth: `/`, `/auth/login`, `/auth/register`, `/auth/reset`.
- Игрок: `/player/dashboard`, `/player/profile` (вкл. историю/достижения), `/player/stats`, `/player/media`.
- Скаут: `/scout` (дашборд), `/scout/search` (фильтры + шортлист + заметки), `/scout/shortlists` (+ детали `/shortlists/[id]` с экспортом), `/scout/filters`, `/scout/notes`.
- Админ: `/admin`, `/admin/players`, `/admin/media`, `/admin/refs`, `/admin/audit`.
- Глобальные уведомления: `/notifications`, индикатор в хедере.
- API-клиент с auto-refresh токена: `apps/web/lib/api-client.ts` (`apiFetch`).

## Дополнительно
- CLI импорт: `npm run import:refs --workspace api -- --file apps/api/scripts/sample-refs.json`, `npm run import:players --workspace api -- --file apps/api/scripts/sample-players.json`.
- Экспорт шортлистов: CSV/XLSX из `/scout/shortlists/[id]`.
- Индикатор уведомлений на клиенте, автообновление каждые 30 секунд.
