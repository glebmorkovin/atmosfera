"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

type AgentCard = {
  cooperationUntil?: string | null;
  potentialText?: string | null;
  skillsText?: string | null;
  contractStatusText?: string | null;
  contactsText?: string | null;
  contactsVisibleAfterEngagement?: boolean;
  contractVisibleAfterEngagement?: boolean;
};

type PlayerMeta = {
  rating?: number | null;
  tags?: string[];
  note?: string | null;
};

type PlayerItem = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth?: string | null;
  city?: string | null;
  country?: string | null;
  currentLeague?: { name?: string } | null;
  currentClub?: { name?: string } | null;
  agentCard?: AgentCard | null;
  meta?: PlayerMeta | null;
};

type Shortlist = {
  id: string;
  name: string;
  description?: string | null;
  players: PlayerItem[];
};

type Note = { id: string; text: string; playerId?: string; shortlistId?: string };

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://atmosfera-api.onrender.com/api";

const calcAge = (dob?: string | null) => {
  if (!dob) return "-";
  const date = new Date(dob);
  const diff = Date.now() - date.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const toMetaDraft = (player: PlayerItem) => ({
  rating: player.meta?.rating?.toString() || "",
  tags: (player.meta?.tags || []).join(", "),
  note: player.meta?.note || ""
});

export default function ShortlistDetailPage() {
  const params = useParams();
  const shortlistId = params?.id as string;
  const [sl, setSl] = useState<Shortlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx">("csv");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [metaDrafts, setMetaDrafts] = useState<Record<string, { rating: string; tags: string; note: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Shortlist>(`/shortlists/${shortlistId}`, { auth: true });
      setSl(data);
      const noteData = await apiFetch<Note[]>(`/notes?shortlistId=${shortlistId}`, { auth: true });
      setNotes(noteData);
    } catch {
      setError("Не удалось загрузить шортлист (нужен вход)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shortlistId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortlistId]);

  useEffect(() => {
    if (!sl) return;
    const drafts: Record<string, { rating: string; tags: string; note: string }> = {};
    sl.players.forEach((player) => {
      drafts[player.id] = toMetaDraft(player);
    });
    setMetaDrafts(drafts);
  }, [sl]);

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) return;
    try {
      await apiFetch(`/shortlists/${shortlistId}/players`, { method: "POST", body: { playerId }, auth: true });
      setPlayerId("");
      load();
    } catch {
      setError("Не удалось добавить игрока");
    }
  };

  const removePlayer = async (id: string) => {
    try {
      await apiFetch(`/shortlists/${shortlistId}/players/${id}`, { method: "DELETE", auth: true });
      load();
    } catch {
      setError("Не удалось удалить игрока");
    }
  };

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await apiFetch("/notes", { method: "POST", body: { shortlistId, text: noteText }, auth: true });
      setNoteText("");
      const noteData = await apiFetch<Note[]>(`/notes?shortlistId=${shortlistId}`, { auth: true });
      setNotes(noteData);
    } catch {
      setError("Не удалось сохранить заметку");
    }
  };

  const exportShortlist = async () => {
    setExporting(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const resp = await fetch(`${apiBase}/shortlists/${shortlistId}/export?format=${exportFormat}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!resp.ok) throw new Error("Export failed");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shortlist-${shortlistId}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось экспортировать шортлист");
    } finally {
      setExporting(false);
    }
  };

  const updateDraft = (playerId: string, key: "rating" | "tags" | "note", value: string) => {
    setMetaDrafts((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [key]: value
      }
    }));
  };

  const saveMeta = async (playerId: string) => {
    const draft = metaDrafts[playerId];
    if (!draft) return;
    setSavingId(playerId);
    setError(null);
    try {
      const ratingValue = draft.rating ? parseInt(draft.rating, 10) : null;
      const tags = draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      await apiFetch(`/shortlists/${shortlistId}/players/${playerId}/meta`, {
        method: "PUT",
        body: {
          rating: Number.isNaN(ratingValue) ? null : ratingValue,
          tags,
          note: draft.note || null
        },
        auth: true
      });
      load();
    } catch {
      setError("Не удалось сохранить мета-данные");
    } finally {
      setSavingId(null);
    }
  };

  const renderMetaEditor = (player: PlayerItem) => {
    const draft = metaDrafts[player.id] || toMetaDraft(player);
    return (
      <div className="space-y-2 text-xs text-white/70">
        <label className="space-y-1">
          <span>Рейтинг (1-10)</span>
          <input
            type="number"
            min={1}
            max={10}
            className="input"
            value={draft.rating}
            onChange={(e) => updateDraft(player.id, "rating", e.target.value)}
          />
        </label>
        <label className="space-y-1">
          <span>Теги</span>
          <input
            className="input"
            value={draft.tags}
            onChange={(e) => updateDraft(player.id, "tags", e.target.value)}
            placeholder="Напр. приоритет, просмотр"
          />
        </label>
        <label className="space-y-1">
          <span>Заметка</span>
          <textarea
            className="input min-h-[70px]"
            value={draft.note}
            onChange={(e) => updateDraft(player.id, "note", e.target.value)}
          />
        </label>
        <button
          className="ghost-btn px-3 py-2 text-xs"
          type="button"
          onClick={() => saveMeta(player.id)}
          disabled={savingId === player.id}
        >
          Сохранить мета
        </button>
      </div>
    );
  };

  const tableRows = useMemo(() => sl?.players || [], [sl]);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Шортлист</p>
            <h1 className="text-3xl font-bold">{sl ? sl.name : "Шортлист"}</h1>
            <p className="text-white/70">Сравнение кандидатов и локальные заметки.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/app/scout/shortlists" className="ghost-btn">
            Назад
          </Link>
        </div>

        {sl && (
          <>
            <form className="card space-y-3" onSubmit={addPlayer}>
              <p className="text-sm text-white/70">Добавить игрока по ID</p>
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="ID игрока"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  required
                />
                <button className="primary-btn px-5 py-3 text-sm" type="submit">Добавить</button>
              </div>
            </form>

            <div className="card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">Сравнение ({sl.players.length})</h3>
                  <p className="text-sm text-white/60">Переключайте таблицу и карточки.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 ${viewMode === "table" ? "bg-white/10 text-white" : "text-white/60"}`}
                      onClick={() => setViewMode("table")}
                    >
                      Таблица
                    </button>
                    <button
                      type="button"
                      className={`rounded-full px-3 py-1 ${viewMode === "cards" ? "bg-white/10 text-white" : "text-white/60"}`}
                      onClick={() => setViewMode("cards")}
                    >
                      Карточки
                    </button>
                  </div>
                  <select
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as "csv" | "xlsx")}
                  >
                    <option value="csv">CSV</option>
                    <option value="xlsx">XLSX</option>
                  </select>
                  <button type="button" className="ghost-btn px-4 py-2 text-sm" onClick={exportShortlist} disabled={exporting}>
                    Экспорт
                  </button>
                </div>
              </div>

              {viewMode === "table" && (
                <div className="overflow-auto rounded-lg border border-white/10">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-left text-white/70">
                      <tr>
                        <th className="px-3 py-2">Игрок</th>
                        <th className="px-3 py-2">Позиция</th>
                        <th className="px-3 py-2">Возраст</th>
                        <th className="px-3 py-2">Город</th>
                        <th className="px-3 py-2">Клуб</th>
                        <th className="px-3 py-2">Потенциал</th>
                        <th className="px-3 py-2">Скиллы</th>
                        <th className="px-3 py-2">Контракт</th>
                        <th className="px-3 py-2">Контакты</th>
                        <th className="px-3 py-2">Мета</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((p) => {
                        const contactsLabel = p.agentCard?.contactsText
                          ? p.agentCard.contactsText
                          : p.agentCard?.contactsVisibleAfterEngagement
                            ? "Скрыто до сотрудничества"
                            : "Нет данных";
                        const contractLabel = p.agentCard?.contractStatusText
                          ? p.agentCard.contractStatusText
                          : p.agentCard?.contractVisibleAfterEngagement
                            ? "Скрыто до сотрудничества"
                            : "Нет данных";
                        return (
                          <tr key={p.id} className="border-t border-white/10 align-top">
                            <td className="px-3 py-3">
                              <div className="font-semibold">{p.firstName} {p.lastName}</div>
                              <div className="text-xs text-white/60">{p.currentLeague?.name || "Лига"}</div>
                            </td>
                            <td className="px-3 py-3">{p.position}</td>
                            <td className="px-3 py-3">{calcAge(p.dateOfBirth)}</td>
                            <td className="px-3 py-3">{p.city || "-"}</td>
                            <td className="px-3 py-3">{p.currentClub?.name || "-"}</td>
                            <td className="px-3 py-3 max-w-[220px] text-xs text-white/70">{p.agentCard?.potentialText || "-"}</td>
                            <td className="px-3 py-3 max-w-[220px] text-xs text-white/70">{p.agentCard?.skillsText || "-"}</td>
                            <td className="px-3 py-3 max-w-[200px] text-xs text-white/70">{contractLabel}</td>
                            <td className="px-3 py-3 max-w-[200px] text-xs text-white/70">{contactsLabel}</td>
                            <td className="px-3 py-3 min-w-[220px]">{renderMetaEditor(p)}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-col gap-2">
                                <Link href={`/app/scout/players/${p.id}`} className="ghost-btn px-3 py-2 text-xs">Профиль</Link>
                                <button className="ghost-btn px-3 py-2 text-xs" onClick={() => removePlayer(p.id)}>Удалить</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {tableRows.length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-white/70" colSpan={11}>Пока нет игроков в шортлисте.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === "cards" && (
                <div className="grid gap-4 md:grid-cols-2">
                  {tableRows.map((p) => {
                    const contactsLabel = p.agentCard?.contactsText
                      ? p.agentCard.contactsText
                      : p.agentCard?.contactsVisibleAfterEngagement
                        ? "Скрыто до сотрудничества"
                        : "Нет данных";
                    const contractLabel = p.agentCard?.contractStatusText
                      ? p.agentCard.contractStatusText
                      : p.agentCard?.contractVisibleAfterEngagement
                        ? "Скрыто до сотрудничества"
                        : "Нет данных";
                    return (
                      <div key={p.id} className="card space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-semibold">{p.firstName} {p.lastName}</h4>
                            <p className="text-sm text-white/60">{p.position} • {p.currentClub?.name || "Клуб"}</p>
                          </div>
                          <span className="pill">Возраст: {calcAge(p.dateOfBirth)}</span>
                        </div>
                        <div className="grid gap-2 text-sm text-white/70">
                          <div>Город: {p.city || "-"}</div>
                          <div>Потенциал: {p.agentCard?.potentialText || "-"}</div>
                          <div>Скиллы: {p.agentCard?.skillsText || "-"}</div>
                          <div>Контракт: {contractLabel}</div>
                          <div>Контакты: {contactsLabel}</div>
                        </div>
                        {renderMetaEditor(p)}
                        <div className="flex gap-2">
                          <Link href={`/app/scout/players/${p.id}`} className="ghost-btn px-3 py-2 text-xs">Профиль</Link>
                          <button className="ghost-btn px-3 py-2 text-xs" onClick={() => removePlayer(p.id)}>Удалить</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-lg font-semibold">Заметки по шортлисту</h4>
                <form className="flex flex-col gap-3 md:flex-row" onSubmit={addNote}>
                  <textarea
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                    placeholder="Добавить заметку по списку"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <button className="primary-btn px-5 py-3 text-sm" type="submit">
                    Сохранить
                  </button>
                </form>
                <div className="space-y-2">
                  {notes.length === 0 && <p className="text-white/70">Заметок пока нет.</p>}
                  {notes.map((n) => (
                    <div key={n.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                      {n.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!sl && !loading && <div className="card text-white/70">Шортлист не найден.</div>}
      </div>
    </main>
  );
}
