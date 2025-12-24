"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

const statusLabels: Record<string, string> = {
  PENDING: "Ожидает ответа",
  ACCEPTED: "Принято",
  DECLINED: "Отклонено",
  CANCELLED: "Отменено",
  EXPIRED: "Истекло"
};

type RequestItem = {
  id: string;
  message?: string | null;
  status: string;
  createdAt: string;
  respondedAt?: string | null;
  initiatorUser?: { id: string; firstName: string; lastName: string; role: string } | null;
  player?: { id: string; firstName: string; lastName: string } | null;
};

export default function PlayerRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<RequestItem[]>("/engagement-requests/inbox", { auth: true });
      setItems(data);
    } catch {
      setError("Не удалось загрузить входящие запросы");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, action: "accept" | "decline") => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/engagement-requests/${id}/${action}`, { method: "POST", auth: true });
      setMessage(action === "accept" ? "Запрос принят" : "Запрос отклонён");
      load();
    } catch {
      setError("Не удалось обновить запрос");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Игрок • Запросы</p>
            <h1 className="text-3xl font-bold">Входящие запросы</h1>
            <p className="text-white/70">Скауты и клубы могут запросить сотрудничество.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
        </div>

        {items.length === 0 && !loading && (
          <div className="card text-white/70">Запросов пока нет. Новые обращения появятся здесь.</div>
        )}

        <div className="grid gap-4">
          {items.map((req) => (
            <div key={req.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/60">Инициатор</p>
                  <p className="text-lg font-semibold">
                    {req.initiatorUser?.firstName} {req.initiatorUser?.lastName}
                    <span className="ml-2 text-xs text-white/60">({req.initiatorUser?.role})</span>
                  </p>
                </div>
                <span className="pill">{statusLabels[req.status] || req.status}</span>
              </div>
              {req.message && <p className="text-white/80">{req.message}</p>}
              <p className="text-xs text-white/50">Создан: {new Date(req.createdAt).toLocaleString("ru-RU")}</p>
              {req.status === "PENDING" && (
                <div className="flex gap-3">
                  <button className="primary-btn px-4 py-2 text-sm" onClick={() => act(req.id, "accept")}>
                    Принять
                  </button>
                  <button className="ghost-btn px-4 py-2 text-sm" onClick={() => act(req.id, "decline")}>
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
