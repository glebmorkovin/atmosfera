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
};

const STATUS_LABELS: Record<Vacancy["status"], string> = {
  DRAFT: "Черновик",
  PENDING_MODERATION: "На модерации",
  PUBLISHED: "Опубликовано",
  REJECTED: "Отклонено",
  ARCHIVED: "В архиве"
};

export default function ClubVacancyDetailPage() {
  const params = useParams();
  const vacancyId = params?.id as string;
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!vacancyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vacancy>(`/club/vacancies/${vacancyId}`, { auth: true });
      setVacancy(data);
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

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Клуб • Вакансии</p>
            <h1 className="text-3xl font-bold">{vacancy?.title || "Вакансия"}</h1>
            <p className="text-white/70">Статус: {vacancy ? STATUS_LABELS[vacancy.status] : "—"}</p>
            {vacancy?.rejectionReason && (
              <p className="text-sm text-amber-300">Причина отклонения: {vacancy.rejectionReason}</p>
            )}
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <div className="flex gap-3">
            <Link href={`/app/club/vacancies/${vacancyId}/edit`} className="ghost-btn">
              Редактировать
            </Link>
            <Link href={`/app/club/vacancies/${vacancyId}/applications`} className="ghost-btn">
              Отклики
            </Link>
            <Link href="/app/club/vacancies" className="ghost-btn">
              К списку
            </Link>
          </div>
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
                <div>Тип: <span className="text-white">{vacancy.type}</span></div>
                <div>Позиции: <span className="text-white">{vacancy.positions?.length ? vacancy.positions.join(", ") : "Не указано"}</span></div>
                <div>Возраст: <span className="text-white">{vacancy.ageFrom ?? "-"}–{vacancy.ageTo ?? "-"}</span></div>
                <div>Локация: <span className="text-white">{vacancy.locationCity || "—"}, {vacancy.locationCountry || "—"}</span></div>
                <div>Дедлайн: <span className="text-white">{vacancy.applicationDeadline ? vacancy.applicationDeadline.slice(0, 10) : "—"}</span></div>
                <div>Контакты: <span className="text-white">{vacancy.contactMode || "—"}</span></div>
              </div>
              {vacancy.status === "PUBLISHED" && (
                <Link href={`/vacancies/${vacancy.id}`} className="ghost-btn w-full justify-center">
                  Открыть публичную страницу
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
