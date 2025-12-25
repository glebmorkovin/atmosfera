"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Application = {
  id: string;
  status: string;
  createdAt: string;
  vacancy: { id: string; title: string; status: string; clubUser?: { firstName?: string; lastName?: string } };
  messageFromClub?: string | null;
};

export default function PlayerApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Application[]>("/player/applications", { auth: true });
      setItems(data);
    } catch {
      setError("Не удалось загрузить отклики");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const withdraw = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/applications/${id}/withdraw`, { method: "POST", auth: true });
      setMessage("Отклик отозван");
      load();
    } catch {
      setError("Не удалось отозвать отклик");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Игрок • Отклики</p>
            <h1 className="text-3xl font-bold">Мои отклики</h1>
            <p className="text-white/70">История откликов на вакансии клубов.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/vacancies" className="ghost-btn">
            Перейти к вакансиям
          </Link>
        </div>

        {items.length === 0 && !loading && (
          <div className="card text-white/70">Откликов пока нет.</div>
        )}

        <div className="grid gap-4">
          {items.map((app) => (
            <div key={app.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{app.vacancy.title}</h3>
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
