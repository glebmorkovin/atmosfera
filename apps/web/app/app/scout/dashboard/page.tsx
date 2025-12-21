import Link from "next/link";

const links = [
  { href: "/app/scout/search", title: "Поиск игроков", desc: "Фильтры, выдача, карточки" },
  { href: "/app/scout/shortlists", title: "Шортлисты", desc: "Сохранённые подборки, экспорт CSV" },
  { href: "/app/scout/requests", title: "Запросы", desc: "Исходящие запросы к игрокам" }
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
