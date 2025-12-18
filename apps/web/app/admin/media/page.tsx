"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type MediaItem = {
  id: string;
  mediaType: string;
  status: string;
  urlOrPath: string;
  moderationComment?: string | null;
  createdAt: string;
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MediaItem[]>("/admin/media", { auth: true });
      setItems(data);
    } catch (err) {
      setError("Нужна авторизация администратора и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: string, status: "APPROVED" | "REJECTED") => {
    setActionMessage(null);
    try {
      await apiFetch(`/admin/media/${id}/moderation`, {
        method: "PUT",
        body: { status }
      });
      setActionMessage(status === "APPROVED" ? "Одобрено" : "Отклонено");
      load();
    } catch {
      setError("Не удалось выполнить модерацию (нужен админ-доступ)");
    }
  };

  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Админ • Медиа</p>
          <h1 className="text-3xl font-bold">Модерация медиа</h1>
          <p className="text-white/70">Список последних файлов с их статусом.</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          {actionMessage && <p className="text-sm text-emerald-300">{actionMessage}</p>}
        </div>
        <Link href="/admin" className="ghost-btn">
          Назад
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="p-2 text-left">Тип</th>
              <th className="p-2 text-left">Статус</th>
              <th className="p-2 text-left">URL/Путь</th>
              <th className="p-2 text-left">Комментарий</th>
              <th className="p-2 text-left">Дата</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="border-t border-white/5">
                <td className="p-2">{m.mediaType}</td>
                <td className="p-2">{m.status}</td>
                <td className="p-2 text-white/70 truncate max-w-xs">{m.urlOrPath}</td>
                <td className="p-2 text-white/70">{m.moderationComment || ""}</td>
                <td className="p-2 text-white/60">{new Date(m.createdAt).toLocaleDateString("ru-RU")}</td>
                <td className="p-2 text-right">
                  <button className="ghost-btn px-3 py-1 text-xs" onClick={() => moderate(m.id, "APPROVED")}>
                    Одобрить
                  </button>
                  <button className="ghost-btn px-3 py-1 text-xs" onClick={() => moderate(m.id, "REJECTED")}>
                    Отклонить
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr className="border-t border-white/5">
                <td className="p-2 text-white/70" colSpan={6}>Нет данных или нет доступа.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
