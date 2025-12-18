import Link from "next/link";

const users = [
  { email: "player@example.com", role: "Игрок", status: "Активен", logins: 5 },
  { email: "parent@example.com", role: "Родитель", status: "Активен", logins: 3 },
  { email: "scout@example.com", role: "Скаут", status: "Активен", logins: 8 }
];

const profiles = [
  { name: "Алексей К.", status: "На модерации", media: 2, updated: "28.05.2024" },
  { name: "Никита С.", status: "Одобрен", media: 3, updated: "20.05.2024" }
];

const media = [
  { title: "Highlight vs Dynamo", type: "video", owner: "player@example.com", status: "На модерации" },
  { title: "Profile photo", type: "image", owner: "player@example.com", status: "Одобрено" }
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">A1/A2/A3 — Админка</p>
            <h1 className="text-3xl font-bold">Администрирование</h1>
            <p className="text-white/70">Пользователи, модерация профилей и медиа.</p>
          </div>
          <Link href="/demo" className="ghost-btn">
            Назад в демо
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Пользователи</h3>
              <button className="ghost-btn px-4 py-2 text-xs">Фильтры</button>
            </div>
            <div className="space-y-2 text-sm">
              {users.map((u) => (
                <div key={u.email} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold">{u.email}</p>
                    <p className="text-white/60">{u.role}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="pill">{u.status}</span>
                    <span>{u.logins} входов</span>
                    <button className="ghost-btn px-3 py-1 text-xs">Изменить роль</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Профили игроков</h3>
              <button className="ghost-btn px-4 py-2 text-xs">Сбросить фильтры</button>
            </div>
            <div className="space-y-2 text-sm">
              {profiles.map((p) => (
                <div key={p.name} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-white/60">Обновлено: {p.updated}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="pill">{p.status}</span>
                    <span>Медиа: {p.media}</span>
                    <button className="ghost-btn px-3 py-1 text-xs">Открыть</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Модерация медиа</h3>
            <button className="ghost-btn px-4 py-2 text-xs">Только на модерации</button>
          </div>
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            {media.map((m) => (
              <div key={m.title} className="rounded-lg bg-white/5 px-3 py-2">
                <p className="font-semibold">{m.title}</p>
                <p className="text-white/60">
                  {m.type} • {m.owner}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                  <span className="pill">{m.status}</span>
                  <button className="ghost-btn px-3 py-1 text-xs">Одобрить</button>
                  <button className="ghost-btn px-3 py-1 text-xs">Отклонить</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
