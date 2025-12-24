"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type MediaItem = {
  id: string;
  mediaType: string;
  urlOrPath: string;
  title?: string | null;
  description?: string | null;
  isProfileMain: boolean;
  status: string;
};

export default function PlayerMediaPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ mediaType: "image", urlOrPath: "", title: "", description: "" });

  const load = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const full = await apiFetch<any>("/players/me", { auth: true });
      setPlayerId(full.id);
      setMedia(full.media || []);
    } catch {
      setError("Не удалось загрузить медиа (нужен вход и API)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/media", {
        method: "POST",
        body: { ...form, playerId, mediaType: form.mediaType, isProfileMain: false },
        auth: true
      });
      setMessage("Медиа добавлено (демо)");
      setForm({ mediaType: "image", urlOrPath: "", title: "", description: "" });
      load();
    } catch {
      setError("Не удалось добавить медиа");
    } finally {
      setLoading(false);
    }
  };

  const setMain = async (id: string) => {
    setMessage(null);
    try {
      await apiFetch(`/media/${id}/main`, { method: "PUT", auth: true });
      setMessage("Главное фото обновлено");
      load();
    } catch {
      setError("Не удалось обновить главное фото");
    }
  };

  const remove = async (id: string) => {
    setMessage(null);
    try {
      await apiFetch(`/media/${id}`, { method: "DELETE", auth: true });
      setMessage("Медиа удалено");
      load();
    } catch {
      setError("Не удалось удалить медиа");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Игрок • Медиа</p>
            <h1 className="text-3xl font-bold">Управление медиа</h1>
            <p className="text-white/70">Загрузка ссылок на фото/видео, выбор главного фото.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/app/player/dashboard" className="ghost-btn">
            К дашборду
          </Link>
        </div>

        {!playerId && !loading && <div className="card text-white/70">Профиль не найден.</div>}

        {playerId && (
          <>
            <form className="card grid gap-3 md:grid-cols-2" onSubmit={upload}>
              <label className="space-y-1 text-sm text-white/80">
                <span>Тип</span>
                <select
                  value={form.mediaType}
                  onChange={(e) => setForm({ ...form, mediaType: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="image">Фото</option>
                  <option value="video">Видео (URL)</option>
                </select>
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>URL / путь</span>
                <input
                  value={form.urlOrPath}
                  onChange={(e) => setForm({ ...form, urlOrPath: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  required
                  placeholder="https://..."
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Название</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  placeholder="Опционально"
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Описание</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Опционально"
                />
              </label>
              <div className="md:col-span-2 flex gap-3">
                <button className="primary-btn px-5 py-3 text-sm" type="submit" disabled={loading}>Добавить медиа</button>
                <button className="ghost-btn px-5 py-3 text-sm" type="button" onClick={load}>Обновить</button>
              </div>
            </form>

            <div className="grid gap-3 md:grid-cols-2">
              {media.map((m) => (
                <div key={m.id} className="card space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex gap-2 items-center">
                      <span className="pill">{m.mediaType}</span>
                      <span className="pill">{m.status}</span>
                    </div>
                    {m.isProfileMain && <span className="pill bg-primary/20 text-primary">Главное</span>}
                  </div>
                  <p className="text-white/70 text-xs break-all">{m.urlOrPath}</p>
                  <p className="text-sm text-white/80">{m.title}</p>
                  <p className="text-sm text-white/60">{m.description}</p>
                  <div className="flex gap-2">
                    <button className="ghost-btn px-3 py-1 text-xs" onClick={() => setMain(m.id)}>
                      Сделать главным
                    </button>
                    <button className="ghost-btn px-3 py-1 text-xs" onClick={() => remove(m.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
              {!loading && media.length === 0 && <div className="card text-white/70 md:col-span-2">Медиа нет.</div>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
