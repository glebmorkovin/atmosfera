"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  player?: { id: string; firstName: string; lastName: string; position?: string | null; currentClub?: { name?: string | null } | null };
};

export default function ScoutRequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<RequestItem[]>("/engagement-requests/outbox", { auth: true });
      setItems(data);
    } catch {
      setError("Не удалось загрузить отправленные запросы");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/engagement-requests/${id}/cancel`, { method: "POST", auth: true });
      setMessage("Запрос отменён");
      load();
    } catch {
      setError("Не удалось отменить запрос");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Запросы</p>
            <h1 className="text-3xl font-bold">Исходящие запросы</h1>
            <p className="text-white/70">История запросов на сотрудничество с игроками.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/app/scout/search" className="ghost-btn">
            Перейти к поиску
          </Link>
        </div>

        {items.length === 0 && !loading && (
          <div className="card text-white/70">Запросов пока нет. Отправьте первый запрос из поиска игроков.</div>
        )}

        <div className="grid gap-4">
          {items.map((req) => (
            <div key={req.id} className="card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white/60">Игрок</p>
                  <p className="text-lg font-semibold">
                    {req.player?.firstName} {req.player?.lastName}
                  </p>
                  <p className="text-sm text-white/60">
                    {req.player?.position || "Позиция"} • {req.player?.currentClub?.name || "Клуб"}
                  </p>
                </div>
                <span className="pill">{statusLabels[req.status] || req.status}</span>
              </div>
              {req.message && <p className="text-white/80">{req.message}</p>}
              <p className="text-xs text-white/50">Создан: {new Date(req.createdAt).toLocaleString("ru-RU")}</p>
              {req.status === "PENDING" && (
                <div className="flex gap-3">
                  <button className="ghost-btn px-4 py-2 text-sm" onClick={() => cancel(req.id)}>
                    Отменить запрос
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
