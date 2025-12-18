import Link from "next/link";

const segments = [
  {
    title: "Игрок",
    caption: "Цифровой паспорт, статистика, медиа, чтобы тебя нашли скауты."
  },
  {
    title: "Родитель",
    caption: "Следите за прогрессом ребёнка, помогайте заполнять профиль и медиа."
  },
  {
    title: "Скаут / Клуб",
    caption: "Поиск, фильтры, шортлисты и заметки по игрокам СНГ."
  },
  {
    title: "Агент",
    caption: "Быстрое досье по игроку и публичная ссылка на профиль."
  }
];

const steps = [
  "Зарегистрируйтесь и выберите роль",
  "Заполните профиль игрока: биография, статистика, медиа",
  "Получайте просмотры и добавления в шортлисты"
];

const samplePlayers = [
  {
    name: "Алексей К.",
    position: "Центр, 2007",
    league: "МХЛ",
    stats: "38 игр, 12+18 очков",
    video: true
  },
  {
    name: "Никита С.",
    position: "Защитник, 2006",
    league: "НМХЛ",
    stats: "41 игра, 5+22 очков",
    video: true
  },
  {
    name: "Илья П.",
    position: "Вратарь, 2008",
    league: "ЮХЛ",
    stats: "Sv% 0.913, GAA 2.05",
    video: false
  }
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-secondary/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="text-lg font-semibold">
            Атмосфера
          </Link>
          <nav className="hidden gap-6 text-sm text-white/80 md:flex">
            <Link href="#players">Игрокам</Link>
            <Link href="#parents">Родителям</Link>
            <Link href="#scouts">Скаутам и клубам</Link>
            <Link href="/auth/login">Войти</Link>
          </nav>
          <Link href="/auth/register" className="primary-btn">
            Зарегистрироваться
          </Link>
        </div>
      </header>

      <section className="border-b border-white/10 bg-gradient-to-br from-primary/10 via-secondary to-black">
        <div className="container flex flex-col gap-10 py-14 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 space-y-6">
            <div className="pill w-fit">Готово к работе</div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Твой цифровой паспорт в хоккее и быстрый поиск для скаутов СНГ
            </h1>
            <p className="max-w-2xl text-lg text-white/80">
              Профиль игрока, статистика, медиа и шортлисты в одном месте.
              Разработано для игроков, родителей, скаутов, клубов и агентов.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/auth/register" className="primary-btn">
                Создать профиль игрока
              </Link>
              <Link href="/auth/login" className="ghost-btn">
                Найти игрока
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-white/60">
              <span className="pill">Безопасность: RBAC • HTTPS</span>
              <span className="pill">Отчёты и шортлисты</span>
            </div>
          </div>
          <div className="card flex-1 space-y-4">
            <p className="text-sm uppercase tracking-wide text-white/60">
              Просмотры профилей
            </p>
            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-3">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-3xl font-bold">1 240</p>
                <p className="text-xs text-white/60">за 30 дней</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-3xl font-bold">62%</p>
                <p className="text-xs text-white/60">с видео</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-3xl font-bold">+18</p>
                <p className="text-xs text-white/60">в шортлистах</p>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-sm text-white/70">
                Пример данных. В реальной среде статистика строится на основе
                событий просмотров и действий скаутов.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="players" className="border-b border-white/10">
        <div className="container py-14">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="pill mb-3">Для кого</p>
              <h2 className="text-3xl font-semibold">Игроки, родители, скауты</h2>
              <p className="text-white/70">
                Сегменты из Value Proposition: быстрый поиск, самопрезентация, удобные инструменты.
              </p>
            </div>
            <Link href="/auth/register" className="ghost-btn">
              Выбрать роль
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment) => (
              <div key={segment.title} className="card space-y-2">
                <h3 className="text-xl font-semibold">{segment.title}</h3>
                <p className="text-sm text-white/70">{segment.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="container grid gap-10 py-14 md:grid-cols-2">
          <div>
            <p className="pill mb-3">Как это работает</p>
            <h2 className="text-3xl font-semibold mb-4">
              Простые шаги: профиль → просмотры → шортлист
            </h2>
            <p className="text-white/70">
              Платформа покрывает регистрацию, заполнение профиля, загрузку медиа,
              поиск и шортлисты. Админка — модерация и справочники.
            </p>
          </div>
          <div className="grid gap-3">
            {steps.map((step, idx) => (
              <div key={step} className="card flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                  {idx + 1}
                </span>
                <p className="text-white/90">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="scouts" className="border-b border-white/10">
        <div className="container py-14">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="pill mb-3">Пример карточек игроков</p>
              <h2 className="text-3xl font-semibold">Что видит скаут</h2>
            </div>
            <Link href="/auth/login" className="ghost-btn">
              Открыть поиск
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {samplePlayers.map((player) => (
              <div key={player.name} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{player.name}</p>
                    <p className="text-sm text-white/60">{player.position}</p>
                  </div>
                  <span className="pill">Лига: {player.league}</span>
                </div>
                <p className="text-sm text-white/80">{player.stats}</p>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Видео: {player.video ? "есть" : "нет"}</span>
                  <span>Статус: демо</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="parents" className="border-b border-white/10 bg-white/5">
        <div className="container flex flex-col gap-10 py-14 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="pill">Родителям</p>
            <h2 className="text-3xl font-semibold">
              Управляйте несколькими профилями детей
            </h2>
            <p className="text-white/70">
              Переключайтесь между профилями, загружайте медиа, контролируйте приватность и видимость в поиске.
            </p>
            <Link href="/auth/register" className="primary-btn">
              Зарегистрироваться как родитель
            </Link>
          </div>
          <div className="card w-full max-w-lg space-y-3">
            <p className="text-sm text-white/70">Пример интерфейса: переключение детей</p>
            <div className="grid gap-2">
              {["Игрок 1 (2008)", "Игрок 2 (2010)", "Игрок 3 (2006)"].map(
                (child) => (
                  <div
                    key={child}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"
                  >
                    <span>{child}</span>
                    <button className="ghost-btn px-4 py-2 text-xs">
                      Открыть профиль
                    </button>
                  </div>
                )
              )}
            </div>
            <p className="text-xs text-white/60">
              В рабочем приложении здесь будет реальный список профилей, завязанный на API.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="container py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="pill mb-3">Безопасность и роли</p>
              <h2 className="text-3xl font-semibold">RBAC и модерация</h2>
              <p className="text-white/70">
                Разграничение прав для гостя, игрока, родителя, скаута, администратора.
                Модерация профилей и медиа в админ-панели.
              </p>
            </div>
            <div className="card space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Шортлисты</span>
                <span className="pill">Скаут</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Модерация профиля</span>
                <span className="pill">Админ</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Приватность контактов</span>
                <span className="pill">Игрок/Родитель</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/60">
        <div className="container flex flex-col gap-3 py-8 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div>© 2024 Атмосфера. Все права защищены.</div>
          <div className="flex gap-4">
            <Link href="#">Политика конфиденциальности</Link>
            <Link href="#">Пользовательское соглашение</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
