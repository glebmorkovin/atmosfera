"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type Shortlist = {
  id: string;
  name: string;
  description?: string | null;
  players?: { id: string; firstName: string; lastName: string; position: string; currentLeague?: { name?: string }; currentClub?: { name?: string } }[];
};

export default function ClubShortlistsPage() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://atmosfera-api.onrender.com/api";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Shortlist[]>("/shortlists", { auth: true });
      setShortlists(data);
    } catch {
      setError("Нужен вход (клуб) и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/shortlists", { method: "POST", body: { name, description }, auth: true });
      setName("");
      setDescription("");
      setMessage("Шортлист создан");
      load();
    } catch {
      setError("Не удалось создать шортлист");
    }
  };

  const remove = async (id: string) => {
    setMessage(null);
    try {
      await apiFetch(`/shortlists/${id}`, { method: "DELETE", auth: true });
      setMessage("Шортлист удалён");
      load();
    } catch {
      setError("Не удалось удалить шортлист");
    }
  };

  const exportCsv = async (shortlistId: string) => {
    setExportingId(shortlistId);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const resp = await fetch(`${apiBase}/shortlists/${shortlistId}/export?format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shortlist-${shortlistId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось экспортировать шортлист");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Клуб • Шортлисты</p>
            <h1 className="text-3xl font-bold">Подборки кандидатов</h1>
            <p className="text-white/70">Сравнивайте игроков и выгружайте CSV.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
          </div>
          <Link href="/app/club/dashboard" className="ghost-btn">
            Назад
          </Link>
        </div>

        <form className="card grid gap-3 md:grid-cols-3" onSubmit={create}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название шортлиста"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            required
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание (опционально)"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <button className="primary-btn justify-center text-sm" type="submit">Создать</button>
        </form>

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
                      <Link href={`/app/club/players/${p.id}`} className="ghost-btn px-3 py-2 text-xs">
                        Открыть профиль
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="primary-btn px-4 py-2 text-xs" onClick={() => exportCsv(sl.id)} disabled={exportingId === sl.id}>
                  Экспорт (CSV)
                </button>
                <button className="ghost-btn px-4 py-2 text-xs" onClick={() => remove(sl.id)}>
                  Удалить
                </button>
                <Link className="ghost-btn px-4 py-2 text-xs" href={`/app/club/shortlists/${sl.id}`}>
                  Открыть
                </Link>
              </div>
            </div>
          ))}
          {!loading && shortlists.length === 0 && <div className="card md:col-span-2 text-white/70">Нет шортлистов.</div>}
        </div>
      </div>
    </main>
  );
}
