"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type StatLine = {
  season?: { name?: string } | null;
  team?: { name?: string } | null;
  league?: { name?: string } | null;
  gamesPlayed?: number | null;
  goals?: number | null;
  assists?: number | null;
  points?: number | null;
  pim?: number | null;
  plusMinus?: number | null;
};

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  currentClub?: { name?: string | null } | null;
  currentLeague?: { name?: string | null } | null;
  statLines?: StatLine[];
};

const recommendations = [
  "Добавьте видео хайлайтов, чтобы повысить интерес скаутов.",
  "Заполните достижения за последние 2 сезона.",
  "Обновите биометрию — рост/вес для фильтров."
];

export default function PlayerDashboard() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const views = [
    { label: "За 7 дней", value: 12 },
    { label: "За 30 дней", value: 45 },
    { label: "Всего", value: 210 }
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const search = await apiFetch<{ data: Player[] }>("/players/search?pageSize=1");
        const first = search.data?.[0];
        if (first) {
          const full = await apiFetch<Player>(`/players/${first.id}`);
          setPlayer(full);
        }
      } catch (err) {
        setError("Не удалось загрузить профиль, показана демо-заглушка.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profileProgress = 78;
  const progressColor = useMemo(() => {
    if (profileProgress >= 80) return "bg-emerald-400";
    if (profileProgress >= 60) return "bg-amber-300";
    return "bg-red-400";
  }, [profileProgress]);

  const stats: StatLine[] = player?.statLines || [];

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-10 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">P1 — Личный кабинет игрока</p>
            <h1 className="text-3xl font-bold">Привет, {player ? `${player.firstName} ${player.lastName}` : "игрок"}!</h1>
            <p className="text-white/70">Статус профиля, просмотры и рекомендации.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/demo" className="ghost-btn">
            Назад в демо
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">Заполненность профиля</p>
                <h3 className="text-xl font-semibold">{profileProgress}%</h3>
              </div>
              <Link href="#" className="ghost-btn px-4 py-2 text-xs">
                Дополнить профиль
              </Link>
            </div>
            <div className="h-3 w-full rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${progressColor}`}
                style={{ width: `${profileProgress}%` }}
              />
            </div>
            <p className="text-sm text-white/70">
              Заполните биографию, добавьте видео и последние стат-линии, чтобы чаще попадать в поиск скаутов.
            </p>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Просмотры профиля</h3>
              <Link href="#" className="ghost-btn px-4 py-2 text-xs">
                Подробнее
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {views.map((item) => (
                <div key={item.label} className="rounded-xl bg-white/5 p-4 text-center">
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/60">Данные демо. В проде строится по событиям просмотра.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="card md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Статистика по сезонам</h3>
              <Link href="#" className="ghost-btn px-4 py-2 text-xs">
                Добавить сезон
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/60">
                  <tr>
                    <th className="p-2 text-left">Сезон</th>
                    <th className="p-2 text-left">Команда</th>
                    <th className="p-2 text-left">Лига</th>
                    <th className="p-2 text-right">И</th>
                    <th className="p-2 text-right">Г</th>
                    <th className="p-2 text-right">П</th>
                    <th className="p-2 text-right">О</th>
                    <th className="p-2 text-right">Штр</th>
                    <th className="p-2 text-right">+/-</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row, idx) => (
                    <tr key={idx} className="border-t border-white/5">
                      <td className="p-2">{row.season?.name ?? "-"}</td>
                      <td className="p-2">{row.team?.name ?? "-"}</td>
                      <td className="p-2">{row.league?.name ?? "-"}</td>
                      <td className="p-2 text-right">{row.gamesPlayed ?? "-"}</td>
                      <td className="p-2 text-right">{row.goals ?? "-"}</td>
                      <td className="p-2 text-right">{row.assists ?? "-"}</td>
                      <td className="p-2 text-right">{row.points ?? "-"}</td>
                      <td className="p-2 text-right">{row.pim ?? "-"}</td>
                      <td className="p-2 text-right">{row.plusMinus ?? "-"}</td>
                    </tr>
                  ))}
                  {stats.length === 0 && (
                    <tr className="border-t border-white/5">
                      <td className="p-2 text-white/70" colSpan={9}>
                        Нет данных статистики (добавьте сезон)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card space-y-3">
            <h3 className="text-xl font-semibold">Рекомендации</h3>
            <ul className="space-y-2 text-sm text-white/80">
              {recommendations.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-primary">•</span> {item}
                </li>
              ))}
            </ul>
            <button className="primary-btn w-full justify-center text-sm">Поделиться профилем</button>
          </div>
        </div>
      </div>
    </main>
  );
}
