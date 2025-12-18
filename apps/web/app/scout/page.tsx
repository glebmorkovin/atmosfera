import Link from "next/link";

const links = [
  { href: "/scout/search", title: "Поиск игроков", desc: "Фильтры, выдача, карточки" },
  { href: "/demo/shortlists", title: "Шортлисты", desc: "Сохранённые подборки, экспорт CSV" },
  { href: "/demo/notifications", title: "Уведомления", desc: "Просмотры профиля, шортлисты" }
];

export default function ScoutHome() {
  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Кабинет скаута</p>
          <h1 className="text-3xl font-bold">Инструменты поиска и шортлистов</h1>
          <p className="text-white/70">Выберите раздел: поиск, шортлисты, уведомления.</p>
        </div>
        <Link href="/" className="ghost-btn">
          На главную
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="card space-y-2 hover:border-white/30 transition">
            <p className="pill w-fit">Скаут</p>
            <h3 className="text-xl font-semibold">{link.title}</h3>
            <p className="text-sm text-white/70">{link.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
