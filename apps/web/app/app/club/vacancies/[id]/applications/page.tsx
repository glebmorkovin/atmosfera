"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Application = {
  id: string;
  status: string;
  createdAt: string;
  messageFromPlayer?: string | null;
  messageFromClub?: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position?: string | null;
    city?: string | null;
    dateOfBirth?: string | null;
  };
};

const statusOptions = [
  { value: "SENT", label: "Отправлен" },
  { value: "VIEWED", label: "Просмотрен" },
  { value: "SHORTLISTED", label: "В шортлисте" },
  { value: "INVITED", label: "Приглашён" },
  { value: "REJECTED", label: "Отклонён" },
  { value: "ACCEPTED", label: "Принят" },
  { value: "WITHDRAWN", label: "Отозван" }
];

export default function ClubVacancyApplicationsPage() {
  const params = useParams();
  const vacancyId = params?.id as string;
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; messageFromClub: string }>>({});

  const load = async () => {
    if (!vacancyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Application[]>(`/club/vacancies/${vacancyId}/applications`, { auth: true });
      setItems(data);
      const nextDrafts: Record<string, { status: string; messageFromClub: string }> = {};
      data.forEach((app) => {
        nextDrafts[app.id] = {
          status: app.status,
          messageFromClub: app.messageFromClub || ""
        };
      });
      setDrafts(nextDrafts);
    } catch {
      setError("Не удалось загрузить отклики");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacancyId]);

  const updateDraft = (id: string, field: "status" | "messageFromClub", value: string) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const save = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/club/applications/${id}/status`, {
        method: "PUT",
        body: { status: draft.status, messageFromClub: draft.messageFromClub || undefined },
        auth: true
      });
      setMessage("Статус обновлён");
      load();
    } catch {
      setError("Не удалось обновить статус");
    }
  };

  const hasApplications = useMemo(() => items.length > 0, [items]);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Клуб • Отклики</p>
            <h1 className="text-3xl font-bold">Отклики на вакансию</h1>
            <p className="text-white/70">Управляйте статусами кандидатов и оставляйте комментарии.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <div className="flex gap-3">
            <Link href={`/app/club/vacancies/${vacancyId}`} className="ghost-btn">
              Назад к вакансии
            </Link>
            <Link href="/app/club/vacancies" className="ghost-btn">
              К списку
            </Link>
          </div>
        </div>

        {!hasApplications && !loading && (
          <div className="card text-white/70">Откликов пока нет.</div>
        )}

        <div className="grid gap-4">
          {items.map((app) => (
            <div key={app.id} className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {app.player.firstName} {app.player.lastName}
                  </h3>
                  <p className="text-sm text-white/60">
                    {app.player.position || "Амплуа не указано"} • {app.player.city || "Город не указан"}
                  </p>
                </div>
                <span className="pill">{app.status}</span>
              </div>

              {app.messageFromPlayer && (
                <div className="text-sm text-white/70">
                  Сообщение игрока: {app.messageFromPlayer}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-1 text-sm text-white/80">
                  <span>Статус</span>
                  <select
                    className="input"
                    value={drafts[app.id]?.status || app.status}
                    onChange={(e) => updateDraft(app.id, "status", e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                  <span>Комментарий клуба</span>
                  <textarea
                    className="input min-h-[80px]"
                    value={drafts[app.id]?.messageFromClub || ""}
                    onChange={(e) => updateDraft(app.id, "messageFromClub", e.target.value)}
                  />
                </label>
              </div>

              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Дата отклика: {new Date(app.createdAt).toLocaleDateString("ru-RU")}</span>
                <button className="primary-btn px-4 py-2 text-xs" onClick={() => save(app.id)}>
                  Сохранить статус
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
