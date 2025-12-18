"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type PlayerItem = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  currentLeague?: { name?: string };
  currentClub?: { name?: string };
};

type Shortlist = {
  id: string;
  name: string;
  description?: string | null;
  players: PlayerItem[];
};
type Note = { id: string; text: string; playerId?: string; shortlistId?: string };

export default function ShortlistDetailPage() {
  const params = useParams();
  const shortlistId = params?.id as string;
  const [sl, setSl] = useState<Shortlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Shortlist>(`/shortlists/${shortlistId}`, { auth: true });
      setSl(data);
      const noteData = await apiFetch<Note[]>(`/notes?shortlistId=${shortlistId}`, { auth: true });
      setNotes(noteData);
    } catch (err) {
      setError("Не удалось загрузить шортлист (нужен вход)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shortlistId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortlistId]);

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    try {
      await apiFetch(`/shortlists/${shortlistId}/players`, { method: "POST", body: { playerId }, auth: true });
      setPlayerId("");
      load();
    } catch {
      setError("Не удалось добавить игрока");
    }
  };

  const removePlayer = async (id: string) => {
    try {
      await apiFetch(`/shortlists/${shortlistId}/players/${id}`, { method: "DELETE", auth: true });
      load();
    } catch {
      setError("Не удалось удалить игрока");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await apiFetch("/notes", { method: "POST", body: { shortlistId, text: noteText }, auth: true });
      setNoteText("");
      const noteData = await apiFetch<Note[]>(`/notes?shortlistId=${shortlistId}`, { auth: true });
      setNotes(noteData);
    } catch {
      setError("Не удалось сохранить заметку");
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      const tokens = typeof window !== "undefined" ? localStorage.getItem("tokens") : null;
      const parsed = tokens ? JSON.parse(tokens) : null;
      const token = parsed?.accessToken;
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/shortlists/${shortlistId}/export?format=${exportFormat}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shortlist-${shortlistId}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось экспортировать шортлист");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Шортлист</p>
            <h1 className="text-3xl font-bold">{sl ? sl.name : "Шортлист"}</h1>
            <p className="text-white/70">Добавляйте или удаляйте игроков, уведомления отправятся владельцам.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/scout/shortlists" className="ghost-btn">
            Назад
          </Link>
        </div>

        {sl && (
          <>
            <form className="card space-y-3" onSubmit={addPlayer}>
              <p className="text-sm text-white/70">Добавить игрока по ID</p>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="ID игрока"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  required
                />
                <button className="primary-btn px-5 py-3 text-sm" type="submit">Добавить</button>
              </div>
            </form>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Игроки ({sl.players.length})</h3>
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")}
                  >
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                  </select>
                  <button type="button" className="ghost-btn px-4 py-2 text-sm" onClick={exportCsv} disabled={exporting}>
                    Экспорт
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {sl.players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold">{p.firstName} {p.lastName}</p>
                      <p className="text-white/60">{p.position} • {p.currentLeague?.name || "Лига"}</p>
                      {notes.some((n) => n.playerId === p.id) && (
                        <p className="text-xs text-primary/80">Заметок: {notes.filter((n) => n.playerId === p.id).length}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/scout/player/${p.id}`} className="ghost-btn px-3 py-2 text-xs">Открыть</Link>
                      <button className="ghost-btn px-3 py-2 text-xs" onClick={() => removePlayer(p.id)}>
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
                {sl.players.length === 0 && <p className="text-white/70">Нет игроков.</p>}
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Заметки по шортлисту</h4>
                <form className="flex flex-col gap-3 md:flex-row" onSubmit={addNote}>
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    placeholder="Добавить заметку по списку"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button className="primary-btn px-5 py-3 text-sm" type="submit">
                    Сохранить
                  </button>
                </form>
                <div className="space-y-2">
                  {notes.length === 0 && <p className="text-white/70">Заметок нет.</p>}
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                      {n.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!sl && !loading && <div className="card text-white/70">Шортлист не найден.</div>}
      </div>
    </main>
  );
}
