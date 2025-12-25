"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { getStoredRole, UserRole } from "@/lib/auth";

type Vacancy = {
  id: string;
  title: string;
  type: string;
  positions: string[];
  ageFrom?: number | null;
  ageTo?: number | null;
  locationCity?: string | null;
  locationCountry?: string | null;
  description: string;
  requirements?: string | null;
  conditions?: string | null;
  publishedAt?: string | null;
  contactMode?: string | null;
  clubUser?: { firstName?: string | null; lastName?: string | null };
};

type ParentChild = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
};

export default function VacancyDetailPage() {
  const params = useParams();
  const vacancyId = params?.id as string;
  const [role, setRole] = useState<UserRole | null>(null);
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState("");

  const load = async () => {
    if (!vacancyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Vacancy>(`/vacancies/${vacancyId}`);
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

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const data = await apiFetch<ParentChild[]>("/players/parent/children", { auth: true });
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId((prev) => prev || data[0].id);
        }
      } catch {
        setChildren([]);
      }
    };
    if (role === "PARENT") {
      loadChildren();
    }
  }, [role]);

  const apply = async () => {
    if (!vacancyId) return;
    setError(null);
    setMessage(null);
    try {
      if (role === "PARENT" && !selectedChildId) {
        setError("Выберите профиль ребёнка");
        return;
      }
      await apiFetch(`/vacancies/${vacancyId}/applications`, {
        method: "POST",
        body: {
          messageFromPlayer: applyMessage,
          ...(role === "PARENT" ? { playerId: selectedChildId } : {})
        },
        auth: true
      });
      setMessage("Отклик отправлен");
      setApplyMessage("");
    } catch {
      setError("Не удалось отправить отклик");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Вакансия</p>
            <h1 className="text-3xl font-bold">{vacancy?.title || "Вакансия"}</h1>
            <p className="text-white/70">
              {vacancy?.locationCity || "Город"} • {vacancy?.locationCountry || "Страна"}
            </p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/vacancies" className="ghost-btn">
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
                <div>Тип: <span className="text-white">{vacancy.type}</span></div>
                <div>Позиции: <span className="text-white">{vacancy.positions?.length ? vacancy.positions.join(", ") : "Не указано"}</span></div>
                <div>Возраст: <span className="text-white">{vacancy.ageFrom ?? "-"}–{vacancy.ageTo ?? "-"}</span></div>
                <div>Клуб: <span className="text-white">{vacancy.clubUser?.firstName} {vacancy.clubUser?.lastName}</span></div>
              </div>

              <div className="card space-y-3">
                <h3 className="text-lg font-semibold">Отклик</h3>
                {role === "PLAYER" || role === "PARENT" ? (
                  <>
                    {role === "PARENT" && (
                      <div className="space-y-2 text-sm text-white/70">
                        {children.length > 0 ? (
                          <select
                            className="input"
                            value={selectedChildId}
                            onChange={(e) => setSelectedChildId(e.target.value)}
                          >
                            {children.map((child) => (
                              <option key={child.id} value={child.id}>
                                {child.firstName} {child.lastName} {child.position ? `• ${child.position}` : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p>Нет привязанных профилей детей.</p>
                        )}
                      </div>
                    )}
                    <textarea
                      className="input min-h-[120px]"
                      placeholder="Сообщение клубу (опционально)"
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                    />
                    <button
                      className="primary-btn w-full justify-center"
                      onClick={apply}
                      disabled={role === "PARENT" && children.length === 0}
                    >
                      Откликнуться
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-white/70">Войдите как игрок, чтобы откликнуться.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
