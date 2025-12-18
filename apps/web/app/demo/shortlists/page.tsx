 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Shortlist = {
  id: string;
  name: string;
  description?: string | null;
  players?: { id: string; firstName: string; lastName: string; position: string; currentLeague?: { name?: string }; currentClub?: { name?: string } }[];
};

const demoShortlists: Shortlist[] = [
  {
    id: "demo-sl1",
    name: "Центры МХЛ",
    description: "Демо-подборка",
    players: [{ id: "p1", firstName: "Алексей", lastName: "К.", position: "C" }]
  }
];

export default function ShortlistsPage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>(demoShortlists);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCsv = (sl: Shortlist) => {
    const header = "ФИО,Позиция,Клуб,Лига";
    const rows = (sl.players || []).map((p) =>
      [
        `${p.firstName} ${p.lastName}`.replace(/,/g, " "),
        p.position,
        p.currentClub?.name || "",
        p.currentLeague?.name || ""
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sl.name || "shortlist"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Требуется авторизация скаута/админа; если нет токена — будет ошибка, тогда покажем демо
        const data = await apiFetch<Shortlist[]>("/shortlists", { auth: true });
        setShortlists(data.length ? data : demoShortlists);
      } catch (err) {
        setError("Не удалось загрузить шортлисты (нужен вход). Показаны демо-данные.");
        setShortlists(demoShortlists);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">S4 / S4.2 — Шортлисты</p>
            <h1 className="text-3xl font-bold">Списки игроков</h1>
            <p className="text-white/70">Сохранённые подборки скаута и детали по игрокам.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/demo" className="ghost-btn">
            Назад в демо
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {shortlists.map((sl) => (
            <div key={sl.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{sl.name}</h3>
                  <p className="text-sm text-white/60">{sl.description}</p>
                </div>
                <span className="pill">Игроков: {sl.players?.length ?? 0}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/5 p-3">
                <div className="text-xs text-white/60 mb-2">Игроки</div>
                <div className="space-y-2">
                  {(sl.players || []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold">{p.firstName} {p.lastName}</p>
                        <p className="text-white/60">{p.position} • {p.currentLeague?.name || "Лига"}</p>
                      </div>
                      <Link href="/demo/scout/search" className="ghost-btn px-3 py-2 text-xs">
                        Открыть профиль
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="primary-btn px-4 py-2 text-xs" onClick={() => exportCsv(sl)}>
                  Экспорт (CSV)
                </button>
                <button className="ghost-btn px-4 py-2 text-xs">Удалить</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
