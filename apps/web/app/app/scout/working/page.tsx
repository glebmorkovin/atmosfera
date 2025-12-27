"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/components/alert";
import { LoadingState } from "@/components/loading-state";

type WorkingCard = {
  id: string;
  playerId: string;
  fullName?: string | null;
  birthDate?: string | null;
  cityText?: string | null;
  positionText?: string | null;
  cooperationUntil?: string | null;
  clubText?: string | null;
  pipelineStatus?: string | null;
  tags: string[];
  updatedAt: string;
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString("ru-RU") : "-");

export default function ScoutWorkingPage() {
  const [cards, setCards] = useState<WorkingCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<WorkingCard[]>("/working-cards", { auth: true });
      setCards(data);
    } catch {
      setError("Не удалось загрузить список игроков");
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
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Мои игроки</p>
            <h1 className="text-3xl font-bold">Рабочие карточки</h1>
            <p className="text-white/70">Список игроков, с которыми подтверждено сотрудничество.</p>
          </div>
          <Link href="/app/scout/search" className="ghost-btn">
            Перейти к поиску
          </Link>
        </div>

        {error && <Alert variant="warning" description={error} />}
        {loading && <LoadingState title="Загружаем рабочие карточки..." subtitle="Проверяем обновления по кандидатам." lines={4} />}

        {cards.length === 0 && !loading && (
          <div className="card text-white/70">Пока нет игроков в работе. Отправьте запрос или примите входящий.</div>
        )}

        {cards.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-white/60">
                <tr>
                  <th className="p-3 text-left">Игрок</th>
                  <th className="p-3 text-left">Амплуа</th>
                  <th className="p-3 text-left">Город</th>
                  <th className="p-3 text-left">Сотрудничество</th>
                  <th className="p-3 text-left">Этап</th>
                  <th className="p-3 text-left">Обновлено</th>
                  <th className="p-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className="border-t border-white/10">
                    <td className="p-3">
                      <div className="text-white">{card.fullName || "Без имени"}</div>
                      <div className="text-xs text-white/50">Дата рождения: {formatDate(card.birthDate)}</div>
                    </td>
                    <td className="p-3">{card.positionText || "-"}</td>
                    <td className="p-3">{card.cityText || "-"}</td>
                    <td className="p-3">{card.cooperationUntil || "-"}</td>
                    <td className="p-3">
                      <span className="pill">{card.pipelineStatus || "Без статуса"}</span>
                    </td>
                    <td className="p-3 text-white/70">{formatDate(card.updatedAt)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/app/scout/working/${card.id}`} className="ghost-btn px-3 py-1 text-xs">
                          Карточка
                        </Link>
                        <Link href={`/app/scout/players/${card.playerId}`} className="ghost-btn px-3 py-1 text-xs">
                          Профиль
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
