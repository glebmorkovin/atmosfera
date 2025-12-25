"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Vacancy = {
  id: string;
  title: string;
  type: string;
  positions: string[];
  ageFrom?: number | null;
  ageTo?: number | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  publishedAt?: string | null;
  clubUser?: { firstName?: string | null; lastName?: string | null };
};

export default function VacanciesPage() {
  const [items, setItems] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vacancy[]>("/vacancies");
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

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div>
          <p className="pill mb-2">Вакансии</p>
          <h1 className="text-3xl font-bold">Открытые вакансии клубов</h1>
          <p className="text-white/70">Список опубликованных вакансий и просмотр условий.</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
        </div>

        {items.length === 0 && !loading && (
          <div className="card text-white/70">Подходящих вакансий пока нет.</div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((vacancy) => (
            <div key={vacancy.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{vacancy.title}</h3>
                <span className="pill">{vacancy.type}</span>
              </div>
              <p className="text-sm text-white/70">
                {vacancy.locationCity || "Город"} • {vacancy.locationCountry || "Страна"}
              </p>
              <p className="text-sm text-white/70">
                Позиции: {vacancy.positions?.length ? vacancy.positions.join(", ") : "Не указано"}
              </p>
              <p className="text-sm text-white/70">
                Возраст: {vacancy.ageFrom ?? "-"}–{vacancy.ageTo ?? "-"}
              </p>
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>
                  Клуб: {vacancy.clubUser?.firstName} {vacancy.clubUser?.lastName}
                </span>
                <span>{vacancy.publishedAt ? new Date(vacancy.publishedAt).toLocaleDateString("ru-RU") : ""}</span>
              </div>
              <Link href={`/vacancies/${vacancy.id}`} className="ghost-btn w-fit px-4 py-2 text-xs">
                Открыть
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
