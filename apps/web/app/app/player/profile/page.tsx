"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { Alert } from "@/components/alert";
import { LoadingState } from "@/components/loading-state";

type PlayerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  heightCm?: number | null;
  weightKg?: number | null;
  country?: string | null;
  city?: string | null;
  currentClubId?: string | null;
  currentLeagueId?: string | null;
  bioText?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isPublicInSearch: boolean;
  showContactsToScoutsOnly: boolean;
  agentCard?: AgentCard | null;
  clubHistory?: PlayerHistory[];
  achievements?: PlayerAchievement[];
};

type AgentCard = {
  cooperationUntil?: string | null;
  potentialText?: string | null;
  skillsText?: string | null;
  contractStatusText?: string | null;
  contactsText?: string | null;
  contactsVisibleAfterEngagement: boolean;
  contractVisibleAfterEngagement: boolean;
};

type PlayerHistory = {
  id: string;
  clubId: string;
  leagueId?: string | null;
  seasonId: string;
  comment?: string | null;
  club?: { name: string };
  league?: { name: string };
  season?: { name: string };
};

type PlayerAchievement = {
  id: string;
  year: number;
  tournament: string;
  result: string;
  comment?: string | null;
};

type RefOption = { id: string; name: string; city?: string | null; country?: string | null };

export default function PlayerProfilePage() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [histories, setHistories] = useState<PlayerHistory[]>([]);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [clubs, setClubs] = useState<RefOption[]>([]);
  const [leagues, setLeagues] = useState<RefOption[]>([]);
  const [seasons, setSeasons] = useState<RefOption[]>([]);
  const [newHistory, setNewHistory] = useState<Partial<PlayerHistory>>({});
  const [newAchievement, setNewAchievement] = useState<Partial<PlayerAchievement>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const full = await apiFetch<PlayerProfile>("/players/me", { auth: true });
      setProfile({
        ...full,
        agentCard: ensureAgentCard(full.agentCard)
      });
      setHistories(full.clubHistory || []);
      setAchievements(full.achievements || []);
    } catch {
      setError("Не удалось загрузить профиль. Проверьте вход и попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const loadRefs = async () => {
      try {
        const [clubsRes, leaguesRes, seasonsRes] = await Promise.all([
          apiFetch<RefOption[]>("/refs/clubs", { auth: true }),
          apiFetch<RefOption[]>("/refs/leagues", { auth: true }),
          apiFetch<RefOption[]>("/refs/seasons", { auth: true })
        ]);
        setClubs(clubsRes);
        setLeagues(leaguesRes);
        setSeasons(seasonsRes);
      } catch {
        // игнорируем, можно вводить ID вручную
      }
    };
    loadRefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (key: keyof PlayerProfile, value: any) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const ensureAgentCard = (card?: AgentCard | null): AgentCard => ({
    cooperationUntil: card?.cooperationUntil ?? "",
    potentialText: card?.potentialText ?? "",
    skillsText: card?.skillsText ?? "",
    contractStatusText: card?.contractStatusText ?? "",
    contactsText: card?.contactsText ?? "",
    contactsVisibleAfterEngagement: card?.contactsVisibleAfterEngagement ?? false,
    contractVisibleAfterEngagement: card?.contractVisibleAfterEngagement ?? false
  });

  const updateAgentCard = (key: keyof AgentCard, value: any) => {
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            agentCard: { ...ensureAgentCard(prev.agentCard), [key]: value }
          }
        : prev
    );
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError(null);
    setMessage(null);
    if (!profile.firstName?.trim() || !profile.lastName?.trim()) {
      setError("Укажите имя и фамилию игрока.");
      return;
    }
    if (!profile.position?.trim()) {
      setError("Укажите игровую позицию.");
      return;
    }
    setLoading(true);
    try {
      await apiFetch(`/players/${profile.id}`, { method: "PUT", body: profile, auth: true });
      setMessage("Профиль сохранён");
      load();
    } catch {
      setError("Не удалось сохранить профиль");
    } finally {
      setLoading(false);
    }
  };

  const addHistory = async () => {
    if (!profile) return;
    try {
      const payload = {
        clubId: newHistory.clubId,
        leagueId: newHistory.leagueId,
        seasonId: newHistory.seasonId,
        comment: newHistory.comment
      };
      const created = await apiFetch<PlayerHistory>(`/players/${profile.id}/history`, { method: "POST", body: payload, auth: true });
      setHistories((prev) => [...prev, created]);
      setNewHistory({});
      setMessage("История обновлена");
    } catch {
      setError("Не удалось добавить запись истории");
    }
  };

  const updateHistory = async (history: PlayerHistory) => {
    try {
      await apiFetch(`/players/history/${history.id}`, { method: "PUT", body: history, auth: true });
      setMessage("История обновлена");
    } catch {
      setError("Не удалось сохранить запись истории");
    }
  };

  const deleteHistory = async (id: string) => {
    try {
      await apiFetch(`/players/history/${id}`, { method: "DELETE", auth: true });
      setHistories((prev) => prev.filter((h) => h.id !== id));
    } catch {
      setError("Не удалось удалить запись истории");
    }
  };

  const addAchievement = async () => {
    if (!profile) return;
    try {
      const payload = {
        year: newAchievement.year,
        tournament: newAchievement.tournament,
        result: newAchievement.result,
        comment: newAchievement.comment
      };
      const created = await apiFetch<PlayerAchievement>(`/players/${profile.id}/achievements`, { method: "POST", body: payload, auth: true });
      setAchievements((prev) => [...prev, created]);
      setNewAchievement({});
      setMessage("Достижение добавлено");
    } catch {
      setError("Не удалось добавить достижение");
    }
  };

  const updateAchievement = async (achievement: PlayerAchievement) => {
    try {
      await apiFetch(`/players/achievements/${achievement.id}`, { method: "PUT", body: achievement, auth: true });
      setMessage("Достижение обновлено");
    } catch {
      setError("Не удалось сохранить достижение");
    }
  };

  const deleteAchievement = async (id: string) => {
    try {
      await apiFetch(`/players/achievements/${id}`, { method: "DELETE", auth: true });
      setAchievements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Не удалось удалить достижение");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Игрок • Профиль</p>
            <h1 className="text-3xl font-bold">Редактирование профиля</h1>
          </div>
          <Link href="/app/player/dashboard" className="ghost-btn">
            К дашборду
          </Link>
        </div>

        {error && <Alert variant="warning" description={error} />}
        {message && <Alert variant="success" description={message} />}
        {loading && !profile && <LoadingState title="Загружаем профиль..." subtitle="Подготавливаем форму редактирования." lines={4} />}

        {!profile && !loading && <div className="card text-white/70">Профиль не найден.</div>}

        {profile && (
          <form className="space-y-6" onSubmit={save}>
            <div className="card space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-white/80">
                  <span>Имя</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    required
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Фамилия</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    required
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Позиция</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.position}
                    onChange={(e) => updateField("position", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Текущий клуб</span>
                  <select
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    value={profile.currentClubId || ""}
                    onChange={(e) => updateField("currentClubId", e.target.value || null)}
                  >
                    <option value="">Не указан</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Текущая лига</span>
                  <select
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                    value={profile.currentLeagueId || ""}
                    onChange={(e) => updateField("currentLeagueId", e.target.value || null)}
                  >
                    <option value="">Не указана</option>
                    {leagues.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Город</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Страна</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.country || ""}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Рост (см)</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.heightCm || ""}
                    onChange={(e) => updateField("heightCm", e.target.value ? parseInt(e.target.value, 10) : null)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Вес (кг)</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.weightKg || ""}
                    onChange={(e) => updateField("weightKg", e.target.value ? parseInt(e.target.value, 10) : null)}
                  />
                </label>
              </div>
              <label className="space-y-1 text-sm text-white/80">
                <span>Биография</span>
                <textarea
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  rows={4}
                  value={profile.bioText || ""}
                  onChange={(e) => updateField("bioText", e.target.value)}
                />
              </label>
            </div>

            <div className="card space-y-4">
              <div>
                <p className="pill mb-2">Агентская карточка</p>
                <h2 className="text-xl font-semibold">Данные агентства</h2>
                <p className="text-sm text-white/70">Заполняется игроком или родителем. Для скаутов/клубов часть полей может быть скрыта.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-white/80">
                  <span>Сотрудничество (до/период)</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.agentCard?.cooperationUntil || ""}
                    onChange={(e) => updateAgentCard("cooperationUntil", e.target.value)}
                    placeholder="Напр. до 2026"
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Контактные данные</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.agentCard?.contactsText || ""}
                    onChange={(e) => updateAgentCard("contactsText", e.target.value)}
                    placeholder="Телефон, email, мессенджеры"
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                  <span>Потенциал</span>
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    rows={3}
                    value={profile.agentCard?.potentialText || ""}
                    onChange={(e) => updateAgentCard("potentialText", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                  <span>Скиллы</span>
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    rows={3}
                    value={profile.agentCard?.skillsText || ""}
                    onChange={(e) => updateAgentCard("skillsText", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                  <span>Состояние контракта</span>
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    rows={2}
                    value={profile.agentCard?.contractStatusText || ""}
                    onChange={(e) => updateAgentCard("contractStatusText", e.target.value)}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={profile.agentCard?.contactsVisibleAfterEngagement ?? false}
                    onChange={(e) => updateAgentCard("contactsVisibleAfterEngagement", e.target.checked)}
                  />
                  Показывать контакты только после подтверждённого сотрудничества
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={profile.agentCard?.contractVisibleAfterEngagement ?? false}
                    onChange={(e) => updateAgentCard("contractVisibleAfterEngagement", e.target.checked)}
                  />
                  Показывать контракт только после подтверждённого сотрудничества
                </label>
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="text-xl font-semibold">Контакты и приватность</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1 text-sm text-white/80">
                  <span>Email для связи</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.contactEmail || ""}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                  />
                </label>
                <label className="space-y-1 text-sm text-white/80">
                  <span>Телефон</span>
                  <input
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm"
                    value={profile.contactPhone || ""}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-3 text-sm text-white/80">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.isPublicInSearch}
                    onChange={(e) => updateField("isPublicInSearch", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Показывать профиль в поиске
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.showContactsToScoutsOnly}
                    onChange={(e) => updateField("showContactsToScoutsOnly", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Контакты только скаутам/клубам
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="primary-btn px-5 py-3 text-sm" type="submit" disabled={loading}>
                Сохранить профиль
              </button>
              <Link href="/app/player/dashboard" className="ghost-btn px-5 py-3 text-sm">
                Отмена
              </Link>
            </div>
          </form>
        )}

        {profile && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Карьерная история</h3>
                <p className="text-xs text-white/60">Укажите клуб, лигу и сезон</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="input"
                  value={newHistory.clubId || ""}
                  onChange={(e) => setNewHistory((prev) => ({ ...prev, clubId: e.target.value || undefined }))}
                >
                  <option value="">Клуб</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `(${c.city})` : ""}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={newHistory.leagueId || ""}
                  onChange={(e) => setNewHistory((prev) => ({ ...prev, leagueId: e.target.value || undefined }))}
                >
                  <option value="">Лига</option>
                  {leagues.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input"
                  value={newHistory.seasonId || ""}
                  onChange={(e) => setNewHistory((prev) => ({ ...prev, seasonId: e.target.value || undefined }))}
                >
                  <option value="">Сезон</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Комментарий"
                  value={newHistory.comment || ""}
                  onChange={(e) => setNewHistory((prev) => ({ ...prev, comment: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="primary-btn px-4 py-2 text-sm" onClick={addHistory} disabled={loading}>
                  Добавить запись
                </button>
              </div>
              <div className="space-y-2">
                {histories.length === 0 && <p className="text-sm text-white/60">Пока нет записей</p>}
                {histories.map((h) => (
                  <div key={h.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="input"
                        value={h.clubId}
                        onChange={(e) =>
                          setHistories((prev) => prev.map((item) => (item.id === h.id ? { ...item, clubId: e.target.value } : item)))
                        }
                      />
                      <input
                        className="input"
                        value={h.leagueId || ""}
                        onChange={(e) =>
                          setHistories((prev) => prev.map((item) => (item.id === h.id ? { ...item, leagueId: e.target.value } : item)))
                        }
                      />
                      <input
                        className="input"
                        value={h.seasonId}
                        onChange={(e) =>
                          setHistories((prev) => prev.map((item) => (item.id === h.id ? { ...item, seasonId: e.target.value } : item)))
                        }
                      />
                      <input
                        className="input"
                        value={h.comment || ""}
                        onChange={(e) =>
                          setHistories((prev) => prev.map((item) => (item.id === h.id ? { ...item, comment: e.target.value } : item)))
                        }
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                      <span>Клуб: {h.club?.name || h.clubId}</span>
                      <span>Лига: {h.league?.name || h.leagueId || "-"}</span>
                      <span>Сезон: {h.season?.name || h.seasonId}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ghost-btn px-3 py-2 text-xs"
                        onClick={() => updateHistory(h)}
                        disabled={loading}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="danger-btn px-3 py-2 text-xs"
                        onClick={() => deleteHistory(h.id)}
                        disabled={loading}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Достижения</h3>
                <p className="text-xs text-white/60">Год, турнир и результат</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="input"
                  type="number"
                  placeholder="Год"
                  value={newAchievement.year || ""}
                  onChange={(e) => setNewAchievement((prev) => ({ ...prev, year: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
                />
                <input
                  className="input"
                  placeholder="Турнир"
                  value={newAchievement.tournament || ""}
                  onChange={(e) => setNewAchievement((prev) => ({ ...prev, tournament: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Результат"
                  value={newAchievement.result || ""}
                  onChange={(e) => setNewAchievement((prev) => ({ ...prev, result: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="Комментарий"
                  value={newAchievement.comment || ""}
                  onChange={(e) => setNewAchievement((prev) => ({ ...prev, comment: e.target.value }))}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="primary-btn px-4 py-2 text-sm" onClick={addAchievement} disabled={loading}>
                  Добавить достижение
                </button>
              </div>
              <div className="space-y-2">
                {achievements.length === 0 && <p className="text-sm text-white/60">Пока нет достижений</p>}
                {achievements.map((a) => (
                  <div key={a.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="input"
                        type="number"
                        value={a.year}
                        onChange={(e) =>
                          setAchievements((prev) =>
                            prev.map((item) => (item.id === a.id ? { ...item, year: parseInt(e.target.value, 10) } : item))
                          )
                        }
                      />
                      <input
                        className="input"
                        value={a.tournament}
                        onChange={(e) =>
                          setAchievements((prev) => prev.map((item) => (item.id === a.id ? { ...item, tournament: e.target.value } : item)))
                        }
                      />
                      <input
                        className="input"
                        value={a.result}
                        onChange={(e) =>
                          setAchievements((prev) => prev.map((item) => (item.id === a.id ? { ...item, result: e.target.value } : item)))
                        }
                      />
                      <input
                        className="input"
                        value={a.comment || ""}
                        onChange={(e) =>
                          setAchievements((prev) => prev.map((item) => (item.id === a.id ? { ...item, comment: e.target.value } : item)))
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ghost-btn px-3 py-2 text-xs"
                        onClick={() => updateAchievement(a)}
                        disabled={loading}
                      >
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="danger-btn px-3 py-2 text-xs"
                        onClick={() => deleteAchievement(a.id)}
                        disabled={loading}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
