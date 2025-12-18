"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type Summary = {
  players: number;
  shortlists: number;
  notifications: number;
};

export default function DemoDashboard() {
  const [summary, setSummary] = useState<Summary>({ players: 0, shortlists: 0, notifications: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [players, shortlists, notifications] = await Promise.allSettled([
          apiFetch<{ data: any[] }>("/players/search?pageSize=5"),
          apiFetch<any[]>("/shortlists", { auth: true }),
          apiFetch<any[]>("/notifications", { auth: true })
        ]);
        setSummary({
          players: players.status === "fulfilled" ? players.value.data.length : 0,
          shortlists: shortlists.status === "fulfilled" ? shortlists.value.length : 0,
          notifications: notifications.status === "fulfilled" ? notifications.value.length : 0
        });
        if (shortlists.status === "rejected" || notifications.status === "rejected") {
          setError("Часть данных доступна только после входа (шортлисты, уведомления)");
        }
      } catch (err) {
        setError("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Демо-обзор</p>
            <h1 className="text-3xl font-bold">Быстрые ссылки кабинетов</h1>
            <p className="text-white/70">Используйте эти ссылки, чтобы перейти к ключевым сценариям.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/" className="ghost-btn">
            На главную
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card space-y-2">
            <p className="pill w-fit">Скаут</p>
            <h3 className="text-xl font-semibold">Поиск игроков</h3>
            <p className="text-white/70">Фильтры, выдача, добавление в шортлист.</p>
            <Link href="/demo/scout/search" className="primary-btn px-4 py-2 text-sm">Открыть</Link>
            <p className="text-sm text-white/60">Доступно игроков: {summary.players}</p>
          </div>
          <div className="card space-y-2">
            <p className="pill w-fit">Скаут</p>
            <h3 className="text-xl font-semibold">Шортлисты</h3>
            <p className="text-white/70">Сохранённые подборки с заметками и экспортом.</p>
            <Link href="/demo/shortlists" className="primary-btn px-4 py-2 text-sm">Открыть</Link>
            <p className="text-sm text-white/60">Шортлистов: {summary.shortlists}</p>
          </div>
          <div className="card space-y-2">
            <p className="pill w-fit">Уведомления</p>
            <h3 className="text-xl font-semibold">Просмотры и события</h3>
            <p className="text-white/70">Список уведомлений, просмотр/прочитано.</p>
            <Link href="/demo/notifications" className="primary-btn px-4 py-2 text-sm">Открыть</Link>
            <p className="text-sm text-white/60">Всего уведомлений: {summary.notifications}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card space-y-2">
            <p className="pill w-fit">Игрок</p>
            <h3 className="text-xl font-semibold">Личный кабинет</h3>
            <p className="text-white/70">Статус профиля, статы, медиа.</p>
            <Link href="/demo/player" className="primary-btn px-4 py-2 text-sm">Открыть</Link>
          </div>
          <div className="card space-y-2">
            <p className="pill w-fit">Админ</p>
            <h3 className="text-xl font-semibold">Модерация и справочники</h3>
            <p className="text-white/70">Пользователи, профили, медиа, лиги/клубы/сезоны.</p>
            <Link href="/demo/admin" className="primary-btn px-4 py-2 text-sm">Открыть</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
