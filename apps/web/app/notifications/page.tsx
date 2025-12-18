"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Notification[]>("/notifications", { auth: true });
      setItems(data);
    } catch (err) {
      setError("Нужен вход, чтобы увидеть уведомления.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "POST", auth: true });
      load();
    } catch {
      setError("Не удалось отметить прочитанными");
    }
  };

  const markOne = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "POST", auth: true });
      load();
    } catch {
      setError("Не удалось обновить уведомление");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Уведомления</p>
            <h1 className="text-3xl font-bold">События профиля и шортлистов</h1>
            <p className="text-white/70">Просмотры профиля, добавления в шортлист, модерация.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <div className="flex gap-3">
            <button className="ghost-btn px-4 py-2 text-sm" onClick={markAll}>
              Отметить все прочитанными
            </button>
            <Link href="/" className="ghost-btn">
              На главную
            </Link>
          </div>
        </div>

        {items.length === 0 && !loading && (
          <div className="card text-white/70">Уведомлений нет или нет доступа.</div>
        )}

        <div className="grid gap-3">
          {items.map((n) => (
            <div key={n.id} className="card flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="pill text-xs">{n.type}</span>
                  {!n.isRead && <span className="pill bg-primary/20 text-primary">New</span>}
                </div>
                <h3 className="text-lg font-semibold">{n.title}</h3>
                <p className="text-sm text-white/70">{n.body}</p>
                <p className="text-xs text-white/50">{new Date(n.createdAt).toLocaleString("ru-RU")}</p>
              </div>
              {!n.isRead && (
                <button className="ghost-btn px-3 py-2 text-xs" onClick={() => markOne(n.id)}>
                  Прочитано
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
