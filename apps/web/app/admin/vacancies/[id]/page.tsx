"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Vacancy = {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING_MODERATION" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  type: string;
  positions: string[];
  ageFrom?: number | null;
  ageTo?: number | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  description: string;
  requirements?: string | null;
  conditions?: string | null;
  applicationDeadline?: string | null;
  rejectionReason?: string | null;
  contactMode?: string | null;
  createdAt: string;
  clubUser?: { id: string; firstName?: string | null; lastName?: string | null };
  league?: { name?: string | null };
};

const STATUS_LABELS: Record<Vacancy["status"], string> = {
  DRAFT: "Черновик",
  PENDING_MODERATION: "На модерации",
  PUBLISHED: "Опубликовано",
  REJECTED: "Отклонено",
  ARCHIVED: "В архиве"
};

export default function AdminVacancyDetailPage() {
  const params = useParams();
  const vacancyId = params?.id as string;
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    if (!vacancyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vacancy>(`/admin/vacancies/${vacancyId}`, { auth: true });
      setVacancy(data);
      setRejectReason(data.rejectionReason || "");
    } catch {
      setError("Не удалось загрузить вакансию");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vacancyId]);

  const approve = async () => {
    if (!vacancyId) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/admin/vacancies/${vacancyId}/approve`, { method: "POST", auth: true });
      setMessage("Вакансия опубликована");
      load();
    } catch {
      setError("Не удалось опубликовать вакансию");
    }
  };

  const reject = async () => {
    if (!vacancyId) return;
    if (!rejectReason.trim()) {
      setError("Укажите причину отклонения");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/admin/vacancies/${vacancyId}/reject`, {
        method: "POST",
        body: { reason: rejectReason },
        auth: true
      });
      setMessage("Вакансия отклонена");
      load();
    } catch {
      setError("Не удалось отклонить вакансию");
    }
  };

  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Админ • Вакансии</p>
          <h1 className="text-3xl font-bold">{vacancy?.title || "Вакансия"}</h1>
          <p className="text-white/70">Статус: {vacancy ? STATUS_LABELS[vacancy.status] : "—"}</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {message && <p className="text-sm text-emerald-300">{message}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
        </div>
        <Link href="/admin/vacancies" className="ghost-btn">
          Назад
        </Link>
      </div>

      {vacancy && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="card space-y-3">
              <h2 className="text-xl font-semibold">Описание</h2>
              <p className="text-white/80 whitespace-pre-wrap">{vacancy.description}</p>
            </div>
            {vacancy.requirements && (
              <div className="card space-y-3">
                <h2 className="text-xl font-semibold">Требования</h2>
                <p className="text-white/80 whitespace-pre-wrap">{vacancy.requirements}</p>
              </div>
            )}
            {vacancy.conditions && (
              <div className="card space-y-3">
                <h2 className="text-xl font-semibold">Условия</h2>
                <p className="text-white/80 whitespace-pre-wrap">{vacancy.conditions}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card space-y-2 text-sm text-white/70">
              <div>Клуб: <span className="text-white">{vacancy.clubUser?.firstName} {vacancy.clubUser?.lastName}</span></div>
              <div>Тип: <span className="text-white">{vacancy.type}</span></div>
              <div>Позиции: <span className="text-white">{vacancy.positions?.length ? vacancy.positions.join(", ") : "—"}</span></div>
              <div>Возраст: <span className="text-white">{vacancy.ageFrom ?? "-"}–{vacancy.ageTo ?? "-"}</span></div>
              <div>Локация: <span className="text-white">{vacancy.locationCity || "—"}, {vacancy.locationCountry || "—"}</span></div>
              <div>Лига: <span className="text-white">{vacancy.league?.name || "—"}</span></div>
              <div>Дедлайн: <span className="text-white">{vacancy.applicationDeadline ? vacancy.applicationDeadline.slice(0, 10) : "—"}</span></div>
              <div>Контакты: <span className="text-white">{vacancy.contactMode || "—"}</span></div>
              <div>Создано: <span className="text-white">{new Date(vacancy.createdAt).toLocaleDateString("ru-RU")}</span></div>
            </div>

            {vacancy.status === "PENDING_MODERATION" && (
              <div className="card space-y-3">
                <h3 className="text-lg font-semibold">Решение модерации</h3>
                <button className="primary-btn w-full justify-center" onClick={approve}>
                  Опубликовать
                </button>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Причина отклонения"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <button className="ghost-btn w-full justify-center" onClick={reject}>
                  Отклонить
                </button>
              </div>
            )}

            {vacancy.status !== "PENDING_MODERATION" && (
              <div className="card text-sm text-white/70">
                Модерация уже завершена. Изменить решение нельзя.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
