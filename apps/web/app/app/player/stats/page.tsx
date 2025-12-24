"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type StatLine = {
  id: string;
  seasonId?: string | null;
  teamId?: string | null;
  leagueId?: string | null;
  gamesPlayed?: number | null;
  goals?: number | null;
  assists?: number | null;
  points?: number | null;
  pim?: number | null;
  plusMinus?: number | null;
  season?: { name?: string } | null;
  team?: { name?: string } | null;
  league?: { name?: string } | null;
};

type Player = { id: string; firstName: string; lastName: string; statLines?: StatLine[] };
type RefOption = { id: string; name: string; city?: string | null };

export default function PlayerStatsPage() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<StatLine[]>([]);
  const [seasons, setSeasons] = useState<RefOption[]>([]);
  const [leagues, setLeagues] = useState<RefOption[]>([]);
  const [clubs, setClubs] = useState<RefOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    seasonId: "",
    leagueId: "",
    teamId: "",
    gamesPlayed: "",
    goals: "",
    assists: "",
    points: "",
    pim: "",
    plusMinus: ""
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const full = await apiFetch<Player>("/players/me", { auth: true });
      setPlayer(full);
      setStats(full.statLines || []);
      const [seasonsRes, leaguesRes, clubsRes] = await Promise.all([
        apiFetch<RefOption[]>("/refs/seasons", { auth: true }),
        apiFetch<RefOption[]>("/refs/leagues", { auth: true }),
        apiFetch<RefOption[]>("/refs/clubs", { auth: true })
      ]);
      setSeasons(seasonsRes);
      setLeagues(leaguesRes);
      setClubs(clubsRes);
    } catch {
      setError("Не удалось загрузить данные (нужен вход и запущенный API)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      seasonId: "",
      leagueId: "",
      teamId: "",
      gamesPlayed: "",
      goals: "",
      assists: "",
      points: "",
      pim: "",
      plusMinus: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const payload = {
      seasonId: form.seasonId || undefined,
      leagueId: form.leagueId || undefined,
      teamId: form.teamId || undefined,
      gamesPlayed: form.gamesPlayed ? parseInt(form.gamesPlayed, 10) : null,
      goals: form.goals ? parseInt(form.goals, 10) : null,
      assists: form.assists ? parseInt(form.assists, 10) : null,
      points: form.points ? parseInt(form.points, 10) : null,
      pim: form.pim ? parseInt(form.pim, 10) : null,
      plusMinus: form.plusMinus ? parseInt(form.plusMinus, 10) : null
    };
    try {
      if (editingId) {
        await apiFetch(`/players/stats/${editingId}`, { method: "PUT", body: payload, auth: true });
        setMessage("Статистика обновлена");
      } else {
        await apiFetch(`/players/${player.id}/stats`, { method: "POST", body: payload, auth: true });
        setMessage("Строка добавлена");
      }
      resetForm();
      load();
    } catch {
      setError("Не удалось сохранить статистику");
    } finally {
      setLoading(false);
    }
  };

  const editRow = (stat: StatLine) => {
    setEditingId(stat.id);
    setForm({
      seasonId: stat.seasonId || "",
      leagueId: stat.leagueId || "",
      teamId: stat.teamId || "",
      gamesPlayed: stat.gamesPlayed?.toString() || "",
      goals: stat.goals?.toString() || "",
      assists: stat.assists?.toString() || "",
      points: stat.points?.toString() || "",
      pim: stat.pim?.toString() || "",
      plusMinus: stat.plusMinus?.toString() || ""
    });
  };

  const deleteRow = async (id: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/players/stats/${id}`, { method: "DELETE", auth: true });
      setMessage("Строка удалена");
      load();
    } catch {
      setError("Не удалось удалить строку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Игрок • Статистика</p>
            <h1 className="text-3xl font-bold">Редактирование статистики</h1>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/app/player/dashboard" className="ghost-btn">
            К дашборду
          </Link>
        </div>

        {!player && !loading && <div className="card text-white/70">Профиль игрока не найден.</div>}

        {player && (
          <>
            <form className="card grid gap-3 md:grid-cols-3" onSubmit={handleSubmit}>
              <select
                value={form.seasonId}
                onChange={(e) => setForm({ ...form, seasonId: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                required
              >
                <option value="">Сезон</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={form.leagueId}
                onChange={(e) => setForm({ ...form, leagueId: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Лига</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Команда</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ""}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={form.gamesPlayed}
                onChange={(e) => setForm({ ...form, gamesPlayed: e.target.value })}
                placeholder="Игры"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.goals}
                onChange={(e) => setForm({ ...form, goals: e.target.value })}
                placeholder="Голы"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.assists}
                onChange={(e) => setForm({ ...form, assists: e.target.value })}
                placeholder="Передачи"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: e.target.value })}
                placeholder="Очки"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.pim}
                onChange={(e) => setForm({ ...form, pim: e.target.value })}
                placeholder="Штраф"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <input
                type="number"
                value={form.plusMinus}
                onChange={(e) => setForm({ ...form, plusMinus: e.target.value })}
                placeholder="+/ -"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-3 md:col-span-3">
                <button className="primary-btn px-5 py-3 text-sm" type="submit" disabled={loading}>
                  {editingId ? "Сохранить изменения" : "Добавить сезон"}
                </button>
                {editingId && (
                  <button className="ghost-btn px-5 py-3 text-sm" type="button" onClick={resetForm}>
                    Отмена редактирования
                  </button>
                )}
              </div>
            </form>

            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/60">
                  <tr>
                    <th className="p-2 text-left">Сезон</th>
                    <th className="p-2 text-left">Лига</th>
                    <th className="p-2 text-left">Команда</th>
                    <th className="p-2 text-right">И</th>
                    <th className="p-2 text-right">Г</th>
                    <th className="p-2 text-right">П</th>
                    <th className="p-2 text-right">О</th>
                    <th className="p-2 text-right">Штр</th>
                    <th className="p-2 text-right">+/-</th>
                    <th className="p-2 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((row) => (
                    <tr key={row.id} className="border-t border-white/5">
                      <td className="p-2">{row.season?.name || row.seasonId || "-"}</td>
                      <td className="p-2">{row.league?.name || row.leagueId || "-"}</td>
                      <td className="p-2">{row.team?.name || row.teamId || "-"}</td>
                      <td className="p-2 text-right">{row.gamesPlayed ?? "-"}</td>
                      <td className="p-2 text-right">{row.goals ?? "-"}</td>
                      <td className="p-2 text-right">{row.assists ?? "-"}</td>
                      <td className="p-2 text-right">{row.points ?? "-"}</td>
                      <td className="p-2 text-right">{row.pim ?? "-"}</td>
                      <td className="p-2 text-right">{row.plusMinus ?? "-"}</td>
                      <td className="p-2 text-right">
                        <button className="ghost-btn px-3 py-1 text-xs" onClick={() => editRow(row)}>
                          Редактировать
                        </button>
                        <button className="ghost-btn px-3 py-1 text-xs" onClick={() => deleteRow(row.id)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!loading && stats.length === 0 && (
                    <tr className="border-t border-white/5">
                      <td className="p-2 text-white/70" colSpan={10}>Нет строк статистики.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
