"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  moderationStatus: string;
  moderationComment?: string | null;
  isPublicInSearch: boolean;
  createdAt: string;
};

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Player[]>("/admin/players", { auth: true });
      setPlayers(data);
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
      await apiFetch(`/admin/players/${id}/moderation`, {
        method: "PUT",
        body: { status }
      });
      setActionMessage(status === "APPROVED" ? "Профиль одобрен" : "Профиль отклонён");
      load();
    } catch {
      setError("Не удалось выполнить модерацию (нужен админ-доступ)");
    }
  };

  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Админ • Профили</p>
          <h1 className="text-3xl font-bold">Модерация профилей игроков</h1>
          <p className="text-white/70">Список профилей с текущим статусом и датой создания.</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          {actionMessage && <p className="text-sm text-emerald-300">{actionMessage}</p>}
        </div>
        <Link href="/admin/dashboard" className="ghost-btn">
          Назад
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="p-2 text-left">ФИО</th>
              <th className="p-2 text-left">Позиция</th>
              <th className="p-2 text-left">Статус</th>
              <th className="p-2 text-left">Комментарий</th>
              <th className="p-2 text-left">Публичен</th>
              <th className="p-2 text-left">Создан</th>
              <th className="p-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="p-2">{p.firstName} {p.lastName}</td>
                <td className="p-2">{p.position}</td>
                <td className="p-2">{p.moderationStatus}</td>
                <td className="p-2 text-white/70">{p.moderationComment || ""}</td>
                <td className="p-2">{p.isPublicInSearch ? "Да" : "Нет"}</td>
                <td className="p-2 text-white/60">{new Date(p.createdAt).toLocaleDateString("ru-RU")}</td>
                <td className="p-2 text-right">
                  <button className="ghost-btn px-3 py-1 text-xs" onClick={() => moderate(p.id, "APPROVED")}>
                    Одобрить
                  </button>
                  <button className="ghost-btn px-3 py-1 text-xs" onClick={() => moderate(p.id, "REJECTED")}>
                    Отклонить
                  </button>
                </td>
              </tr>
            ))}
            {!loading && players.length === 0 && (
              <tr className="border-t border-white/5">
                <td className="p-2 text-white/70" colSpan={7}>Нет данных или нет доступа.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
