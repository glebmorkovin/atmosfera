"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

type Application = {
  id: string;
  status: string;
  createdAt: string;
  messageFromClub?: string | null;
  player?: { id: string; firstName?: string; lastName?: string };
  vacancy: { id: string; title: string; status: string; clubUser?: { firstName?: string; lastName?: string } };
};

type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
};

export default function ParentApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState("all");

  const loadChildren = async () => {
    setLoadingChildren(true);
    try {
      const data = await apiFetch<ChildProfile[]>("/players/parent/children", { auth: true });
      setChildren(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить список детей");
    } finally {
      setLoadingChildren(false);
    }
  };

  const load = async (playerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = playerId === "all" ? "/parent/applications" : `/parent/applications?playerId=${playerId}`;
      const data = await apiFetch<Application[]>(url, { auth: true });
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить отклики");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    load(selectedPlayerId);
  }, [selectedPlayerId]);

  const uniquePlayers = useMemo(
    () => children.map((child) => ({ id: child.id, name: `${child.firstName} ${child.lastName}`.trim() })),
    [children]
  );

  const filteredItems = useMemo(() => {
    if (selectedPlayerId === "all") return items;
    return items.filter((app) => app.player?.id === selectedPlayerId);
  }, [items, selectedPlayerId]);

  const withdraw = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/applications/${id}/withdraw`, { method: "POST", auth: true });
      setMessage("Отклик отозван");
      load(selectedPlayerId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отозвать отклик");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Родитель • Отклики</p>
            <h1 className="text-3xl font-bold">Отклики детей</h1>
            <p className="text-white/70">Все отклики по привязанным профилям.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/vacancies" className="ghost-btn">
            Перейти к вакансиям
          </Link>
        </div>

        {uniquePlayers.length > 1 && (
          <div className="card flex flex-wrap items-center gap-3">
            <span className="text-sm text-white/70">Ребёнок:</span>
            <select
              className="input"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="all">Все</option>
              {uniquePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {loadingChildren && <div className="card text-white/70">Загружаем список детей...</div>}

        {filteredItems.length === 0 && !loading && !loadingChildren && (
          <div className="card text-white/70">Откликов пока нет. Здесь появятся ответы по вакансиям.</div>
        )}

        <div className="grid gap-4">
          {filteredItems.map((app) => (
            <div key={app.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{app.vacancy.title}</h3>
                  <p className="text-sm text-white/60">
                    Игрок: {app.player?.firstName} {app.player?.lastName}
                  </p>
                  <p className="text-sm text-white/60">
                    Клуб: {app.vacancy.clubUser?.firstName} {app.vacancy.clubUser?.lastName}
                  </p>
                </div>
                <span className="pill">{app.status}</span>
              </div>
              {app.messageFromClub && <p className="text-sm text-white/70">Комментарий клуба: {app.messageFromClub}</p>}
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Дата: {new Date(app.createdAt).toLocaleDateString("ru-RU")}</span>
                {app.status === "SENT" && (
                  <button className="ghost-btn px-3 py-2 text-xs" onClick={() => withdraw(app.id)}>
                    Отозвать
                  </button>
                )}
              </div>
              <Link href={`/vacancies/${app.vacancy.id}`} className="ghost-btn w-fit px-3 py-2 text-xs">
                Открыть вакансию
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
