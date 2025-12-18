import Link from "next/link";

const demoPages = [
  { href: "/demo/player", title: "Личный кабинет игрока (P1)", desc: "Статус профиля, просмотры, рекомендации" },
  { href: "/demo/scout/search", title: "Поиск игрока (S2)", desc: "Фильтры, выдача карточек, добавление в шортлист" },
  { href: "/demo/shortlists", title: "Шортлисты (S4/S4.2)", desc: "Список шортлистов и детали" },
  { href: "/demo/admin", title: "Админка (A1/A2/A3)", desc: "Пользователи, модерация профилей и медиа" }
];

export default function DemoHub() {
  return (
    <main className="min-h-screen bg-secondary">
      <div className="container py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Демо-навигация</p>
            <h1 className="text-3xl font-bold">Быстрые демо-экраны Атмосферы</h1>
            <p className="text-white/70">
              Набор статических страниц для презентации основных сценариев без подключения к прод API.
            </p>
          </div>
          <Link href="/" className="ghost-btn">
            На главную
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {demoPages.map((page) => (
            <Link key={page.href} href={page.href} className="card space-y-2 hover:border-white/30 transition">
              <h2 className="text-xl font-semibold">{page.title}</h2>
              <p className="text-sm text-white/70">{page.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
