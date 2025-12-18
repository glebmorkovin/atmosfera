"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type PlayerCard = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth?: string;
  currentClub?: { name?: string | null } | null;
  currentLeague?: { name?: string | null } | null;
  media?: { urlOrPath: string }[];
  statLines?: { season?: { name?: string }; gamesPlayed?: number; goals?: number; assists?: number; points?: number }[];
  city?: string | null;
  country?: string | null;
};

const demoPlayers: PlayerCard[] = [
  {
    id: "p1",
    firstName: "Алексей",
    lastName: "К.",
    position: "C",
    currentLeague: { name: "МХЛ" },
    currentClub: { name: "СКА-1946" },
    statLines: [{ season: { name: "23/24" }, gamesPlayed: 38, goals: 12, assists: 18, points: 30 }]
  },
  {
    id: "p2",
    firstName: "Никита",
    lastName: "С.",
    position: "D",
    currentLeague: { name: "НМХЛ" },
    currentClub: { name: "Красная Армия" },
    statLines: [{ season: { name: "23/24" }, gamesPlayed: 41, goals: 5, assists: 22, points: 27 }]
  },
  {
    id: "p3",
    firstName: "Илья",
    lastName: "П.",
    position: "G",
    currentLeague: { name: "ЮХЛ" },
    currentClub: { name: "Белые Медведи U18" },
    statLines: [{ season: { name: "23/24" }, gamesPlayed: 32 }]
  }
];

const positions = ["Все", "C", "LW", "RW", "D", "G"];
const leagues = ["Все", "МХЛ", "НМХЛ", "ЮХЛ"];

export default function ScoutSearchPage() {
  const [position, setPosition] = useState("Все");
  const [league, setLeague] = useState("Все");
  const [hasVideo, setHasVideo] = useState(false);
  const [players, setPlayers] = useState<PlayerCard[]>(demoPlayers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ data: PlayerCard[] }>("/players/search?pageSize=30");
        setPlayers(data.data.length ? data.data : demoPlayers);
      } catch (err) {
        setError("Не удалось загрузить игроков, показаны демо-данные");
        setPlayers(demoPlayers);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (position !== "Все" && p.position !== position) return false;
      if (league !== "Все" && (p.currentLeague?.name || "") !== league) return false;
      if (hasVideo && !(p.media && p.media.length)) return false;
      return true;
    });
  }, [players, position, league, hasVideo]);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">S2 — Поиск игроков</p>
            <h1 className="text-3xl font-bold">Расширенный поиск</h1>
            <p className="text-white/70">
              Фильтры по позиции, лиге, наличию видео. При наличии связи с API используются реальные данные, иначе показаны демо.
            </p>
          </div>
          <Link href="/demo" className="ghost-btn">
            Назад в демо
          </Link>
        </div>

        <div className="card space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2 text-sm text-white/80">
              <span>Позиция</span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Лига</span>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {leagues.map((lg) => (
                  <option key={lg} value={lg}>
                    {lg}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm text-white/80">
              <input
                type="checkbox"
                checked={hasVideo}
                onChange={(e) => setHasVideo(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Есть видео
            </label>
          </div>
        </div>

        {error && <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">{error}</div>}
        {loading && <div className="text-white/70">Загрузка игроков...</div>}

        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-sm text-white/60">
                    {p.position} • {p.currentLeague?.name || "Лига"}
                  </p>
                </div>
                <span className="pill">{p.currentClub?.name || "Клуб"}</span>
              </div>
              <p className="text-sm text-white/80">
                {p.statLines?.[0]
                  ? `${p.statLines[0].season?.name || "Сезон"}: ${p.statLines[0].gamesPlayed ?? "-"} игр, ${p.statLines[0].goals ?? 0} + ${p.statLines[0].assists ?? 0} = ${p.statLines[0].points ?? 0} очков`
                  : "Без статистики"}
              </p>
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>Видео: {p.media && p.media.length ? "есть" : "нет"}</span>
                <Link href="/demo/shortlists" className="text-primary">
                  Добавить в шортлист
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card md:col-span-3 text-center text-white/70">
              По заданным фильтрам игроков не найдено.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
