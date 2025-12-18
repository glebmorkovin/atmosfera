"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type Note = {
  id: string;
  text: string;
  playerId?: string | null;
  shortlistId?: string | null;
  createdAt: string;
};

export default function ScoutNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [shortlistId, setShortlistId] = useState("");
  const [text, setText] = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Note[]>("/notes", { auth: true });
      setNotes(data);
    } catch {
      setError("Нужен вход (скаут/админ) и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || (!playerId && !shortlistId)) {
      setError("Укажите текст и playerId или shortlistId");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/notes", {
        method: "POST",
        body: { text, playerId: playerId || undefined, shortlistId: shortlistId || undefined },
        auth: true
      });
      setText("");
      setPlayerId("");
      setShortlistId("");
      setMessage("Заметка сохранена");
      load();
    } catch {
      setError("Не удалось сохранить заметку");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE", auth: true });
      setMessage("Удалено");
      load();
    } catch {
      setError("Не удалось удалить");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Заметки</p>
            <h1 className="text-3xl font-bold">Личные заметки</h1>
            <p className="text-white/70">Привязывайте заметки к игрокам или шортлистам. Видны только вам.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/scout" className="ghost-btn">
            Назад
          </Link>
        </div>

        <form className="card space-y-3" onSubmit={create}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Текст заметки"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            rows={3}
            required
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder="playerId (опционально)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <input
              value={shortlistId}
              onChange={(e) => setShortlistId(e.target.value)}
              placeholder="shortlistId (опционально)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <button className="primary-btn justify-center text-sm" type="submit">Сохранить заметку</button>
        </form>

        <div className="grid gap-3 md:grid-cols-2">
          {notes.map((n) => (
            <div key={n.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  {n.playerId && <p className="text-xs text-white/60">Игрок: {n.playerId}</p>}
                  {n.shortlistId && <p className="text-xs text-white/60">Шортлист: {n.shortlistId}</p>}
                  <p className="text-xs text-white/50">{new Date(n.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <button className="ghost-btn px-3 py-1 text-xs" onClick={() => remove(n.id)}>
                  Удалить
                </button>
              </div>
              <p className="text-sm text-white/80 whitespace-pre-wrap">{n.text}</p>
            </div>
          ))}
          {!loading && notes.length === 0 && <div className="card md:col-span-2 text-white/70">Нет заметок.</div>}
        </div>
      </div>
    </main>
  );
}
