"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError, apiFetch } from "@/lib/api-client";

type PlayerCard = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  currentClub?: { name?: string | null } | null;
  currentLeague?: { name?: string | null } | null;
  media?: { urlOrPath: string }[];
  statLines?: { season?: { name?: string }; gamesPlayed?: number; goals?: number; assists?: number; points?: number }[];
  city?: string | null;
  country?: string | null;
};

const positions = ["Все", "C", "LW", "RW", "D", "G"];

type SavedFilter = {
  id: string;
  name: string;
  config: Record<string, any>;
};

type RefOption = { id: string; name: string; city?: string | null; country?: string | null };
type Note = { id: string; text: string; playerId?: string; shortlistId?: string };

export default function ScoutSearchRealPage() {
  const [position, setPosition] = useState("Все");
  const [leagueId, setLeagueId] = useState("");
  const [clubId, setClubId] = useState("");
  const [hasVideo, setHasVideo] = useState(false);
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [newFilterName, setNewFilterName] = useState("");
  const [savingFilter, setSavingFilter] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<RefOption[]>([]);
  const [clubs, setClubs] = useState<RefOption[]>([]);
  const [shortlists, setShortlists] = useState<{ id: string; name: string }[]>([]);
  const [targetShortlist, setTargetShortlist] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [leagueQuery, setLeagueQuery] = useState("");
  const [clubQuery, setClubQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPlayers = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({ pageSize: String(pageSize), page: String(targetPage) });
      if (position !== "Все") query.set("position", position);
      if (leagueId) query.set("leagueId", leagueId);
      if (clubId) query.set("clubId", clubId);
      if (hasVideo) query.set("hasVideo", "true");
      const data = await apiFetch<{
        data: PlayerCard[];
        pagination?: { page: number; pageSize: number; total: number; totalPages: number };
      }>(`/players/search?${query.toString()}`, { auth: true });
      setPlayers(data.data || []);
      const nextTotalPages = data.pagination?.totalPages ?? 1;
      setPage(data.pagination?.page || targetPage);
      setTotalPages(nextTotalPages > 0 ? nextTotalPages : 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Нужен вход, чтобы использовать поиск игроков.");
        } else if (err.status === 403) {
          setError("Нет доступа к поиску игроков для этой роли.");
        } else {
          setError("Не удалось загрузить игроков. Попробуйте позже.");
        }
      } else {
        setError("Не удалось загрузить игроков. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers(1);
    const loadFilters = async () => {
      try {
        const data = await apiFetch<SavedFilter[]>("/search-filters", { auth: true });
        setSavedFilters(data);
      } catch {
        setSavedFilters([]);
      }
    };
    const loadRefs = async () => {
      try {
        const [leaguesRes, clubsRes] = await Promise.all([
          apiFetch<RefOption[]>("/refs/leagues", { auth: true }),
          apiFetch<RefOption[]>("/refs/clubs", { auth: true })
        ]);
        setLeagues(leaguesRes);
        setClubs(clubsRes);
      } catch {
        // ignore
      }
    };
    const loadShortlists = async () => {
      try {
        const data = await apiFetch<{ id: string; name: string }[]>("/shortlists", { auth: true });
        setShortlists(data);
      } catch {
        setShortlists([]);
      }
    };
    const loadNotes = async () => {
      try {
        const data = await apiFetch<Note[]>("/notes", { auth: true });
        setNotes(data);
      } catch {
        setNotes([]);
      }
    };
    loadFilters();
    loadRefs();
    loadShortlists();
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = (cfg: Record<string, any>) => {
    if (cfg.position) setPosition(cfg.position);
    if (cfg.leagueId) {
      setLeagueId(cfg.leagueId);
      const l = leagues.find((x) => x.id === cfg.leagueId);
      setLeagueQuery(l?.name || "");
    }
    if (cfg.clubId) {
      setClubId(cfg.clubId);
      const c = clubs.find((x) => x.id === cfg.clubId);
      setClubQuery(c?.name || "");
    }
    if (typeof cfg.hasVideo === "boolean") setHasVideo(cfg.hasVideo);
  };

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (position !== "Все" && p.position !== position) return false;
      if (leagueId && (p.currentLeague?.name || "") === "" && p.currentLeague?.name !== undefined) {
        // keep server-side filter; skip additional check
      }
      if (hasVideo && !(p.media && p.media.length)) return false;
      return true;
    });
  }, [players, position, leagueId, hasVideo]);

  const saveFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;
    setSavingFilter(true);
    setError(null);
    try {
      const config: Record<string, any> = {};
      if (position !== "Все") config.position = position;
      if (leagueId) config.leagueId = leagueId;
      if (clubId) config.clubId = clubId;
      if (hasVideo) config.hasVideo = hasVideo;
      const created = await apiFetch<SavedFilter>("/search-filters", {
        method: "POST",
        body: { name: newFilterName.trim(), config },
        auth: true
      });
      setSavedFilters((prev) => [...prev, created]);
      setNewFilterName("");
    } catch {
      setError("Не удалось сохранить фильтр (нужен вход)");
    } finally {
      setSavingFilter(false);
    }
  };

  const deleteFilter = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await apiFetch(`/search-filters/${id}`, { method: "DELETE", auth: true });
      setSavedFilters((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError("Не удалось удалить фильтр");
    } finally {
      setDeletingId(null);
    }
  };

  const addToShortlist = async (playerId: string) => {
    if (!targetShortlist) {
      setError("Выберите шортлист");
      return;
    }
    setAddingId(playerId);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/shortlists/${targetShortlist}/players`, { method: "POST", body: { playerId }, auth: true });
      setMessage("Игрок добавлен в шортлист");
    } catch {
      setError("Не удалось добавить игрока в шортлист");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Поиск игроков</p>
            <h1 className="text-3xl font-bold">Расширенный поиск (реальные данные)</h1>
            <p className="text-white/70">Требуется запущенный API и токен (войти). Фильтры по позиции/лиге/видео.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
            {error && !loading && (
              <button className="ghost-btn mt-2 px-4 py-2 text-xs" type="button" onClick={() => loadPlayers(1)}>
                Повторить
              </button>
            )}
          </div>
          <Link href="/app/scout/dashboard" className="ghost-btn">
            Назад
          </Link>
        </div>

        <div className="card space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <input
                  list="league-options"
                  value={leagueQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLeagueQuery(val);
                    const match = leagues.find((l) => l.name === val);
                    setLeagueId(match?.id || "");
                  }}
                  placeholder="Начните вводить лигу"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <datalist id="league-options">
                  {leagues.map((l) => (
                    <option key={l.id} value={l.name} />
                  ))}
                </datalist>
                <div className="flex gap-2 text-xs text-white/60">
                  <button
                    type="button"
                    className="text-white/60 hover:text-primary"
                    onClick={() => {
                      setLeagueId("");
                      setLeagueQuery("");
                    }}
                  >
                    Сбросить лигу
                  </button>
                  {leagueId && <span className="pill">ID: {leagueId}</span>}
                </div>
              </div>
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Клуб</span>
              <div className="space-y-2">
                <input
                  list="club-options"
                  value={clubQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClubQuery(val);
                    const match = clubs.find((c) => c.name === val);
                    setClubId(match?.id || "");
                  }}
                  placeholder="Начните вводить клуб"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <datalist id="club-options">
                  {clubs.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                <div className="flex gap-2 text-xs text-white/60">
                  <button
                    type="button"
                    className="text-white/60 hover:text-primary"
                    onClick={() => {
                      setClubId("");
                      setClubQuery("");
                    }}
                  >
                    Сбросить клуб
                  </button>
                  {clubId && <span className="pill">ID: {clubId}</span>}
                </div>
              </div>
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
          {savedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              <span className="pill">Сохранённые фильтры:</span>
              {savedFilters.map((f) => (
                <div key={f.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <button className="text-primary" onClick={() => applyFilter(f.config)}>
                    {f.name}
                  </button>
                  <button
                    className="text-white/60 hover:text-red-300"
                    onClick={() => deleteFilter(f.id)}
                    disabled={deletingId === f.id}
                    title="Удалить"
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <form className="flex flex-col gap-3 md:flex-row md:items-center" onSubmit={saveFilter}>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Название фильтра для сохранения"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
            />
            <button className="ghost-btn px-4 py-3 text-sm" type="submit" disabled={savingFilter}>
              Сохранить текущий фильтр
            </button>
          </form>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-white/80">
              Шортлист для добавления:
              <select
                className="ml-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={targetShortlist}
                onChange={(e) => setTargetShortlist(e.target.value)}
              >
                <option value="">Не выбран</option>
                {shortlists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-3">
            <button className="primary-btn px-4 py-2 text-sm" type="button" onClick={() => loadPlayers(1)} disabled={loading}>
              Применить фильтры
            </button>
            <button
              className="ghost-btn px-4 py-2 text-sm"
              type="button"
              onClick={() => {
                setPosition("Все");
                setLeagueId("");
                setClubId("");
                setHasVideo(false);
                loadPlayers(1);
              }}
            >
              Сбросить
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-sm text-white/60">{p.position} • {p.currentLeague?.name || "Лига"}</p>
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
                <div className="flex gap-2">
                  <Link href={`/app/scout/players/${p.id}`} className="text-primary">
                    Профиль
                  </Link>
                  <Link href="/app/scout/shortlists" className="text-white/60 hover:text-primary">
                    Шортлисты
                  </Link>
                  {targetShortlist && (
                    <button
                      className="text-white/60 hover:text-primary"
                      onClick={() => addToShortlist(p.id)}
                      disabled={addingId === p.id}
                    >
                      В выбранный шортлист
                    </button>
                  )}
                  {notes.some((n) => n.playerId === p.id) && (
                    <span className="text-primary/80">Заметки: {notes.filter((n) => n.playerId === p.id).length}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="card md:col-span-3 text-center text-white/70">Игроки не найдены. Попробуйте другие фильтры.</div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
          <span>Найдено: {total}</span>
          <div className="flex items-center gap-3">
            <button className="ghost-btn px-3 py-2 text-xs" onClick={() => loadPlayers(page - 1)} disabled={loading || page <= 1}>
              Назад
            </button>
            <span>
              Страница {page} из {totalPages}
            </span>
            <button
              className="ghost-btn px-3 py-2 text-xs"
              onClick={() => loadPlayers(page + 1)}
              disabled={loading || page >= totalPages}
            >
              Дальше
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
