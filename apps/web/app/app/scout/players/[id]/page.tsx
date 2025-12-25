"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api-client";

type StatLine = {
  id: string;
  gamesPlayed?: number | null;
  goals?: number | null;
  assists?: number | null;
  points?: number | null;
  pim?: number | null;
  plusMinus?: number | null;
  season?: { name?: string | null };
  league?: { name?: string | null };
  team?: { name?: string | null };
};

type MediaItem = {
  id: string;
  mediaType: string;
  urlOrPath: string;
  title?: string | null;
  description?: string | null;
  isProfileMain: boolean;
  status: string;
};

type History = {
  id: string;
  clubId: string;
  leagueId?: string | null;
  seasonId: string;
  comment?: string | null;
  club?: { name?: string | null };
  league?: { name?: string | null };
  season?: { name?: string | null };
};

type Achievement = {
  id: string;
  year: number;
  tournament: string;
  result: string;
  comment?: string | null;
};

type AgentCard = {
  cooperationUntil?: string | null;
  potentialText?: string | null;
  skillsText?: string | null;
  contractStatusText?: string | null;
  contactsText?: string | null;
  contactsVisibleAfterEngagement?: boolean;
  contractVisibleAfterEngagement?: boolean;
};

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth: string;
  heightCm?: number | null;
  weightKg?: number | null;
  city?: string | null;
  country?: string | null;
  currentClub?: { name?: string | null } | null;
  currentLeague?: { name?: string | null } | null;
  media?: MediaItem[];
  statLines?: StatLine[];
  clubHistory?: History[];
  achievements?: Achievement[];
  bioText?: string | null;
  agentCard?: AgentCard | null;
};

export default function ScoutPlayerProfilePage() {
  const params = useParams();
  const playerId = params?.id as string;
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [shortlistId, setShortlistId] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<Player>(`/players/${playerId}`, { auth: true });
      setPlayer(data);
      // зафиксировать просмотр
      apiFetch(`/players/${playerId}/view`, { method: "POST", auth: true }).catch(() => null);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Профиль скрыт или не найден.");
        } else if (err.status === 403) {
          setError("Нет доступа к этому профилю.");
        } else if (err.status === 401) {
          setError("Нужен вход, чтобы открыть профиль.");
        } else {
          setError("Не удалось загрузить профиль. Попробуйте позже.");
        }
      } else {
        setError("Не удалось загрузить профиль. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const addToShortlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortlistId || !playerId) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/shortlists/${shortlistId}/players`, { method: "POST", body: { playerId }, auth: true });
      setMessage("Игрок добавлен в шортлист");
      setShortlistId("");
    } catch {
      setError("Не удалось добавить в шортлист");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim() || !playerId) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/notes", { method: "POST", body: { playerId, text: note }, auth: true });
      setNote("");
      setMessage("Заметка сохранена");
    } catch {
      setError("Не удалось сохранить заметку");
    }
  };

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/engagement-requests", { method: "POST", body: { playerId, message: requestMessage }, auth: true });
      setMessage("Запрос отправлен");
      setRequestMessage("");
    } catch (err) {
      const text = err instanceof Error ? err.message : "";
      setError(text.includes("409") || text.toLowerCase().includes("уже") ? "Запрос уже отправлен" : "Не удалось отправить запрос");
    }
  };

  const mediaApproved = useMemo(() => (player?.media || []).filter((m) => m.status === "APPROVED"), [player]);
  const agentCard = player?.agentCard;
  const contactsLabel = agentCard?.contactsText
    ? agentCard.contactsText
    : agentCard?.contactsVisibleAfterEngagement
      ? "Скрыто до подтверждённого сотрудничества"
      : "Нет данных";
  const contractLabel = agentCard?.contractStatusText
    ? agentCard.contractStatusText
    : agentCard?.contractVisibleAfterEngagement
      ? "Скрыто до подтверждённого сотрудничества"
      : "Нет данных";

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Профиль игрока</p>
            <h1 className="text-3xl font-bold">Просмотр игрока</h1>
            {player && (
              <p className="text-white/70">
                {player.position} • {player.currentClub?.name || "Клуб"} • {player.currentLeague?.name || "Лига"}
              </p>
            )}
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/app/scout/search" className="ghost-btn">
            Назад к поиску
          </Link>
        </div>

        {!player && !loading && <div className="card text-white/70">Профиль не найден.</div>}

        {player && (
          <div className="space-y-6">
            <div className="card grid gap-6 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <h2 className="text-2xl font-semibold">
                  {player.firstName} {player.lastName}
                </h2>
                <p className="text-white/70">
                  {player.country && `${player.country}, `}{player.city}
                  {player.heightCm ? ` • ${player.heightCm} см` : ""}{player.weightKg ? ` • ${player.weightKg} кг` : ""}
                </p>
                <p className="text-white/70">{player.bioText || "Биография не заполнена"}</p>
              </div>
              <div className="space-y-3 rounded-xl bg-white/5 p-4 text-sm">
                <form className="space-y-3" onSubmit={addToShortlist}>
                  <p className="text-white/80">Добавить в шортлист</p>
                  <input
                    className="input"
                    placeholder="ID шортлиста"
                    value={shortlistId}
                    onChange={(e) => setShortlistId(e.target.value)}
                  />
                  <button className="primary-btn w-full py-2 text-sm" type="submit">
                    Добавить
                  </button>
                </form>
                <form className="space-y-3 border-t border-white/10 pt-3" onSubmit={sendRequest}>
                  <p className="text-white/80">Запрос на сотрудничество</p>
                  <textarea
                    className="input h-24"
                    value={requestMessage}
                    placeholder="Сообщение игроку (опционально)"
                    onChange={(e) => setRequestMessage(e.target.value)}
                  />
                  <button className="primary-btn w-full py-2 text-sm" type="submit">
                    Отправить запрос
                  </button>
                </form>
                <form className="space-y-3 border-t border-white/10 pt-3" onSubmit={addNote}>
                  <p className="text-white/80">Заметка по игроку</p>
                  <textarea
                    className="input h-24"
                    value={note}
                    placeholder="Краткая заметка"
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button className="ghost-btn w-full py-2 text-sm" type="submit">
                    Сохранить заметку
                  </button>
                </form>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="text-xl font-semibold">Статистика</h3>
              <div className="overflow-auto rounded-lg border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5">
                    <tr className="text-left text-white/70">
                      <th className="px-3 py-2">Сезон</th>
                      <th className="px-3 py-2">Лига</th>
                      <th className="px-3 py-2">Команда</th>
                      <th className="px-3 py-2">И</th>
                      <th className="px-3 py-2">Г</th>
                      <th className="px-3 py-2">П</th>
                      <th className="px-3 py-2">О</th>
                      <th className="px-3 py-2">ШТР</th>
                    </tr>
                  </thead>
                  <tbody>
                    {player.statLines?.map((s) => (
                      <tr key={s.id} className="border-t border-white/5 text-white/80">
                        <td className="px-3 py-2">{s.season?.name || "-"}</td>
                        <td className="px-3 py-2">{s.league?.name || "-"}</td>
                        <td className="px-3 py-2">{s.team?.name || "-"}</td>
                        <td className="px-3 py-2">{s.gamesPlayed ?? "-"}</td>
                        <td className="px-3 py-2">{s.goals ?? "-"}</td>
                        <td className="px-3 py-2">{s.assists ?? "-"}</td>
                        <td className="px-3 py-2">{s.points ?? "-"}</td>
                        <td className="px-3 py-2">{s.pim ?? "-"}</td>
                      </tr>
                    ))}
                    {(!player.statLines || player.statLines.length === 0) && (
                      <tr>
                        <td className="px-3 py-2 text-white/60" colSpan={8}>
                          Нет статистики.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="text-xl font-semibold">Агентская карточка</h3>
              {agentCard ? (
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-white/60">Сотрудничество</p>
                    <p className="text-white/90">{agentCard.cooperationUntil || "Нет данных"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-white/60">Контакты агентства</p>
                    <p className="text-white/90">{contactsLabel}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 md:col-span-2">
                    <p className="text-white/60">Потенциал</p>
                    <p className="text-white/90">{agentCard.potentialText || "Нет данных"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 md:col-span-2">
                    <p className="text-white/60">Скиллы</p>
                    <p className="text-white/90">{agentCard.skillsText || "Нет данных"}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3 md:col-span-2">
                    <p className="text-white/60">Состояние контракта</p>
                    <p className="text-white/90">{contractLabel}</p>
                  </div>
                </div>
              ) : (
                <p className="text-white/60">Карточка не заполнена.</p>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card space-y-3">
                <h3 className="text-xl font-semibold">Карьерная история</h3>
                <div className="space-y-2 text-sm">
                  {player.clubHistory?.map((h) => (
                    <div key={h.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="font-semibold">{h.club?.name || h.clubId}</p>
                      <p className="text-white/70">{h.league?.name || h.leagueId || "Лига"} • {h.season?.name || h.seasonId}</p>
                      {h.comment && <p className="text-white/60">{h.comment}</p>}
                    </div>
                  ))}
                  {(!player.clubHistory || player.clubHistory.length === 0) && (
                    <p className="text-white/60">История не заполнена.</p>
                  )}
                </div>
              </div>

              <div className="card space-y-3">
                <h3 className="text-xl font-semibold">Достижения</h3>
                <div className="space-y-2 text-sm">
                  {player.achievements?.map((a) => (
                    <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="font-semibold">{a.year} • {a.tournament}</p>
                      <p className="text-white/70">{a.result}</p>
                      {a.comment && <p className="text-white/60">{a.comment}</p>}
                    </div>
                  ))}
                  {(!player.achievements || player.achievements.length === 0) && (
                    <p className="text-white/60">Нет достижений.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="text-xl font-semibold">Медиа</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {mediaApproved.map((m) => (
                  <div key={m.id} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                    <p className="text-sm font-semibold">{m.title || m.mediaType}</p>
                    <p className="text-xs text-white/60">{m.description}</p>
                    <Link href={m.urlOrPath} className="text-primary text-sm" target="_blank">
                      Открыть
                    </Link>
                    {m.isProfileMain && <span className="pill">Главное</span>}
                  </div>
                ))}
                {mediaApproved.length === 0 && <p className="text-white/60">Нет медиа.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
