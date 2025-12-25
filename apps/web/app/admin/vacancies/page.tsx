"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Vacancy = {
  id: string;
  title: string;
  status: "DRAFT" | "PENDING_MODERATION" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
  locationCity?: string | null;
  locationCountry?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  clubUser?: { id: string; firstName?: string | null; lastName?: string | null };
};

const STATUS_TABS: { value: "PENDING_MODERATION" | "PUBLISHED" | "REJECTED" | "ARCHIVED" | "DRAFT"; label: string }[] = [
  { value: "PENDING_MODERATION", label: "Ожидают" },
  { value: "PUBLISHED", label: "Опубликованы" },
  { value: "REJECTED", label: "Отклонены" },
  { value: "ARCHIVED", label: "Архив" },
  { value: "DRAFT", label: "Черновики" }
];

const STATUS_LABELS: Record<Vacancy["status"], string> = {
  DRAFT: "Черновик",
  PENDING_MODERATION: "На модерации",
  PUBLISHED: "Опубликовано",
  REJECTED: "Отклонено",
  ARCHIVED: "В архиве"
};

export default function AdminVacanciesPage() {
  const [items, setItems] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<Vacancy["status"]>("PENDING_MODERATION");

  const load = async (status: Vacancy["status"]) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vacancy[]>(`/admin/vacancies?status=${status}`, { auth: true });
      setItems(data);
    } catch {
      setError("Нужна авторизация администратора и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeStatus);
  }, [activeStatus]);

  const hasItems = useMemo(() => items.length > 0, [items]);

  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Админ • Вакансии</p>
          <h1 className="text-3xl font-bold">Модерация вакансий</h1>
          <p className="text-white/70">Проверяйте заявки клубов и публикуйте их.</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
        </div>
        <Link href="/admin/dashboard" className="ghost-btn">
          Назад
        </Link>
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

      {!hasItems && !loading && (
        <div className="card text-white/70">Вакансий в этом статусе пока нет.</div>
      )}

      <div className="grid gap-4">
        {items.map((vacancy) => (
          <div key={vacancy.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{vacancy.title}</h3>
                <p className="text-sm text-white/60">
                  {vacancy.locationCity || "Город"} • {vacancy.locationCountry || "Страна"}
                </p>
                <p className="text-sm text-white/60">
                  Клуб: {vacancy.clubUser?.firstName} {vacancy.clubUser?.lastName}
                </p>
              </div>
              <span className="pill">{STATUS_LABELS[vacancy.status]}</span>
            </div>
            {vacancy.rejectionReason && (
              <p className="text-sm text-amber-300">Причина отклонения: {vacancy.rejectionReason}</p>
            )}
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Создано: {new Date(vacancy.createdAt).toLocaleDateString("ru-RU")}</span>
              <Link href={`/admin/vacancies/${vacancy.id}`} className="ghost-btn px-4 py-2 text-xs">
                Открыть
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
