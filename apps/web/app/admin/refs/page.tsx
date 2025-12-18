"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type League = { id: string; name: string; country?: string | null; level?: string | null };
type Club = { id: string; name: string; country?: string | null; city?: string | null; leagueId?: string | null };
type Season = { id: string; name: string; startYear: number; endYear: number };

export default function AdminRefsPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [newLeague, setNewLeague] = useState({ name: "", country: "", level: "" });
  const [newClub, setNewClub] = useState({ name: "", country: "", city: "", leagueId: "" });
  const [newSeason, setNewSeason] = useState({ name: "", startYear: "", endYear: "" });

  const load = async () => {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const [leaguesData, clubsData, seasonsData] = await Promise.all([
        apiFetch<League[]>("/admin/leagues", { auth: true }),
        apiFetch<Club[]>("/admin/clubs", { auth: true }),
        apiFetch<Season[]>("/admin/seasons", { auth: true })
      ]);
      setLeagues(leaguesData);
      setClubs(clubsData);
      setSeasons(seasonsData);
    } catch (err) {
      setError("Нужна авторизация администратора и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/admin/leagues", { method: "POST", body: newLeague, auth: true });
      setMsg("Лига добавлена");
      setNewLeague({ name: "", country: "", level: "" });
      load();
    } catch {
      setError("Не удалось добавить лигу (нужен админ-доступ)");
    }
  };

  const createClub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/admin/clubs", { method: "POST", body: { ...newClub, leagueId: newClub.leagueId || undefined }, auth: true });
      setMsg("Клуб добавлен");
      setNewClub({ name: "", country: "", city: "", leagueId: "" });
      load();
    } catch {
      setError("Не удалось добавить клуб (нужен админ-доступ)");
    }
  };

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/admin/seasons", {
        method: "POST",
        body: {
          name: newSeason.name,
          startYear: parseInt(newSeason.startYear, 10),
          endYear: parseInt(newSeason.endYear, 10)
        },
        auth: true
      });
      setMsg("Сезон добавлен");
      setNewSeason({ name: "", startYear: "", endYear: "" });
      load();
    } catch {
      setError("Не удалось добавить сезон (нужен админ-доступ)");
    }
  };

  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Админ • Справочники</p>
          <h1 className="text-3xl font-bold">Лиги, клубы, сезоны</h1>
          <p className="text-white/70">Список справочников. CRUD можно добавить поверх этих данных.</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          {msg && <p className="text-sm text-emerald-300">{msg}</p>}
        </div>
        <Link href="/admin" className="ghost-btn">
          Назад
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Лиги</h3>
            <span className="pill">{leagues.length}</span>
          </div>
          <div className="space-y-1 text-sm max-h-80 overflow-y-auto">
            {leagues.map((l) => (
              <div key={l.id} className="rounded-lg bg-white/5 px-3 py-2">
                <p className="font-semibold">{l.name}</p>
                <p className="text-white/60 text-xs">{l.country} {l.level}</p>
              </div>
            ))}
            {leagues.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
          <form className="space-y-2 pt-3 border-t border-white/10" onSubmit={createLeague}>
            <input
              value={newLeague.name}
              onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
              placeholder="Название"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <input
              value={newLeague.country}
              onChange={(e) => setNewLeague({ ...newLeague, country: e.target.value })}
              placeholder="Страна"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <input
              value={newLeague.level}
              onChange={(e) => setNewLeague({ ...newLeague, level: e.target.value })}
              placeholder="Уровень"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <button className="primary-btn w-full justify-center text-sm" type="submit">Добавить лигу</button>
          </form>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Клубы</h3>
            <span className="pill">{clubs.length}</span>
          </div>
          <div className="space-y-1 text-sm max-h-80 overflow-y-auto">
            {clubs.map((c) => (
              <div key={c.id} className="rounded-lg bg-white/5 px-3 py-2">
                <p className="font-semibold">{c.name}</p>
                <p className="text-white/60 text-xs">{c.country} {c.city}</p>
              </div>
            ))}
            {clubs.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
          <form className="space-y-2 pt-3 border-t border-white/10" onSubmit={createClub}>
            <input
              value={newClub.name}
              onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
              placeholder="Название"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <input
              value={newClub.country}
              onChange={(e) => setNewClub({ ...newClub, country: e.target.value })}
              placeholder="Страна"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <input
              value={newClub.city}
              onChange={(e) => setNewClub({ ...newClub, city: e.target.value })}
              placeholder="Город"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <input
              value={newClub.leagueId}
              onChange={(e) => setNewClub({ ...newClub, leagueId: e.target.value })}
              placeholder="ID лиги (необязательно)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <button className="primary-btn w-full justify-center text-sm" type="submit">Добавить клуб</button>
          </form>
        </div>

        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Сезоны</h3>
            <span className="pill">{seasons.length}</span>
          </div>
          <div className="space-y-1 text-sm max-h-80 overflow-y-auto">
            {seasons.map((s) => (
              <div key={s.id} className="rounded-lg bg-white/5 px-3 py-2">
                <p className="font-semibold">{s.name}</p>
                <p className="text-white/60 text-xs">{s.startYear}–{s.endYear}</p>
              </div>
            ))}
            {seasons.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
          <form className="space-y-2 pt-3 border-t border-white/10" onSubmit={createSeason}>
            <input
              value={newSeason.name}
              onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
              placeholder="Название"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <input
              value={newSeason.startYear}
              onChange={(e) => setNewSeason({ ...newSeason, startYear: e.target.value })}
              placeholder="Год начала (2023)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <input
              value={newSeason.endYear}
              onChange={(e) => setNewSeason({ ...newSeason, endYear: e.target.value })}
              placeholder="Год окончания (2024)"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <button className="primary-btn w-full justify-center text-sm" type="submit">Добавить сезон</button>
          </form>
        </div>
      </div>
    </main>
  );
}
