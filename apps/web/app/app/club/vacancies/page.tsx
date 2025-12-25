"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  rejectionReason?: string | null;
  _count?: { applications: number };
};

const STATUS_LABELS: Record<Vacancy["status"], string> = {
  DRAFT: "Черновик",
  PENDING_MODERATION: "На модерации",
  PUBLISHED: "Опубликовано",
  REJECTED: "Отклонено",
  ARCHIVED: "В архиве"
};

const STATUS_TABS: { value: "ALL" | Vacancy["status"]; label: string }[] = [
  { value: "ALL", label: "Все" },
  { value: "DRAFT", label: "Черновики" },
  { value: "PENDING_MODERATION", label: "На модерации" },
  { value: "PUBLISHED", label: "Опубликовано" },
  { value: "REJECTED", label: "Отклонено" },
  { value: "ARCHIVED", label: "Архив" }
];

export default function ClubVacanciesPage() {
  const [items, setItems] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<"ALL" | Vacancy["status"]>("DRAFT");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vacancy[]>("/club/vacancies", { auth: true });
      setItems(data);
    } catch {
      setError("Не удалось загрузить вакансии");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeStatus === "ALL") return items;
    return items.filter((item) => item.status === activeStatus);
  }, [items, activeStatus]);

  const submit = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/club/vacancies/${id}/submit`, { method: "POST", auth: true });
      setMessage("Вакансия отправлена на модерацию");
      load();
    } catch {
      setError("Не удалось отправить вакансию на модерацию");
    }
  };

  const archive = async (id: string) => {
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/club/vacancies/${id}/archive`, { method: "POST", auth: true });
      setMessage("Вакансия перемещена в архив");
      load();
    } catch {
      setError("Не удалось архивировать вакансию");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Клуб • Вакансии</p>
            <h1 className="text-3xl font-bold">Вакансии клуба</h1>
            <p className="text-white/70">Создавайте и модерируйте объявления о просмотрах.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <div className="flex gap-3">
            <Link href="/app/club/vacancies/new" className="primary-btn">
              Создать вакансию
            </Link>
            <Link href="/app/club/dashboard" className="ghost-btn">
              Назад
            </Link>
          </div>
        </div>

        <div className="card flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`ghost-btn px-4 py-2 text-xs ${activeStatus === tab.value ? "border-white/60 bg-white/10" : ""}`}
              onClick={() => setActiveStatus(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="card text-white/70">Вакансий в этом разделе пока нет.</div>
        )}

        <div className="grid gap-4">
          {filtered.map((vacancy) => (
            <div key={vacancy.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{vacancy.title}</h3>
                  <p className="text-sm text-white/60">
                    {vacancy.locationCity || "Город"} • {vacancy.locationCountry || "Страна"}
                  </p>
                </div>
                <span className="pill">{STATUS_LABELS[vacancy.status]}</span>
              </div>
              {vacancy.rejectionReason && (
                <p className="text-sm text-amber-300">Причина отклонения: {vacancy.rejectionReason}</p>
              )}
              <div className="text-sm text-white/70">
                Позиции: {vacancy.positions?.length ? vacancy.positions.join(", ") : "Не указано"}
              </div>
              <div className="text-sm text-white/70">
                Возраст: {vacancy.ageFrom ?? "-"}–{vacancy.ageTo ?? "-"}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                <span>Откликов: {vacancy._count?.applications ?? 0}</span>
                <span>Тип: {vacancy.type}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link className="ghost-btn px-4 py-2 text-xs" href={`/app/club/vacancies/${vacancy.id}`}>
                  Открыть
                </Link>
                <Link className="ghost-btn px-4 py-2 text-xs" href={`/app/club/vacancies/${vacancy.id}/applications`}>
                  Отклики
                </Link>
                {(vacancy.status === "DRAFT" || vacancy.status === "REJECTED") && (
                  <Link className="ghost-btn px-4 py-2 text-xs" href={`/app/club/vacancies/${vacancy.id}/edit`}>
                    Редактировать
                  </Link>
                )}
                {(vacancy.status === "DRAFT" || vacancy.status === "REJECTED") && (
                  <button className="primary-btn px-4 py-2 text-xs" onClick={() => submit(vacancy.id)}>
                    На модерацию
                  </button>
                )}
                {vacancy.status === "PUBLISHED" && (
                  <button className="ghost-btn px-4 py-2 text-xs" onClick={() => archive(vacancy.id)}>
                    В архив
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
