import Link from "next/link";
import { PublicOnly } from "@/components/public-only";

const segments = [
  {
    title: "Игрок",
    caption: "Личный профиль, статистика и видео — чтобы вас нашли."
  },
  {
    title: "Родитель",
    caption: "Управляйте профилями детей и контролируйте приватность."
  },
  {
    title: "Скаут",
    caption: "Поиск кандидатов, шортлисты и заметки по каждому игроку."
  },
  {
    title: "Клуб",
    caption: "Подбор и работа с кандидатами, вакансии и отклики."
  }
];

const benefits = [
  {
    title: "Единый профиль",
    caption: "Статистика, история, медиа и достижения в одном месте."
  },
  {
    title: "Поиск и шортлисты",
    caption: "Фильтры, сравнение и быстрый отбор кандидатов."
  },
  {
    title: "Контакты по правилам",
    caption: "Доступ к контактам открывается после подтверждения сотрудничества."
  }
];

const steps = [
  "Создайте профиль и выберите роль",
  "Добавьте статистику, видео и достижения",
  "Получайте запросы и предложения от клубов и скаутов"
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
    <PublicOnly>
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
              <div className="pill w-fit">Sports-tech платформа</div>
              <h1 className="text-4xl font-bold leading-tight md:text-5xl">
                Твой цифровой паспорт в хоккее
              </h1>
              <p className="max-w-2xl text-lg text-white/80">
                Профиль, статистика, видео и контакт с клубами и скаутами — в одном месте.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/register" className="primary-btn">
                  Создать профиль игрока
                </Link>
                <Link href="/auth/login" className="ghost-btn">
                  Найти игроков
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="pill">Защищённый доступ</span>
                <span className="pill">Модерация профилей</span>
                <span className="pill">Контроль приватности</span>
              </div>
            </div>
            <div className="card flex-1 space-y-4">
              <p className="text-sm uppercase tracking-wide text-white/60">Почему Атмосфера</p>
              <div className="grid gap-3">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-lg font-semibold">{benefit.title}</p>
                    <p className="text-sm text-white/70">{benefit.caption}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="players" className="border-b border-white/10">
          <div className="container py-14">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="pill mb-3">Для кого</p>
                <h2 className="text-3xl font-semibold">Профили для всех участников рынка</h2>
                <p className="text-white/70">
                  Атмосфера объединяет игроков, родителей, скаутов и клубы в одном стандарте данных.
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
                Простой путь от профиля до предложения
              </h2>
              <p className="text-white/70">
                Создайте профиль, добавьте достижения и видео — дальше сервис делает подбор и коммуникацию прозрачной.
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
                <p className="pill mb-3">Поиск игроков</p>
                <h2 className="text-3xl font-semibold">Карточки в выдаче</h2>
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
                    <span>Статус: в поиске</span>
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
                Управляйте профилями детей в одном кабинете
              </h2>
              <p className="text-white/70">
                Быстро обновляйте данные, следите за запросами и контролируйте видимость профиля в поиске.
              </p>
              <Link href="/auth/register" className="primary-btn">
                Зарегистрироваться как родитель
              </Link>
            </div>
            <div className="card w-full max-w-lg space-y-3">
              <p className="text-sm text-white/70">Список профилей детей и быстрые действия</p>
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
              <p className="text-xs text-white/60">Прямой доступ к профилю, редактированию и запросам.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="container py-14">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="pill mb-3">Безопасность и роли</p>
                <h2 className="text-3xl font-semibold">Роли, модерация, контроль</h2>
                <p className="text-white/70">
                  Доступы разделены по ролям, а профили и медиа проходят модерацию.
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
    </PublicOnly>
  );
}
