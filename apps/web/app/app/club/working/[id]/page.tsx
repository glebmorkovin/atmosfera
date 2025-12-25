"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type WorkingCard = {
  id: string;
  playerId: string;
  fullName?: string | null;
  birthDate?: string | null;
  cityText?: string | null;
  positionText?: string | null;
  cooperationUntil?: string | null;
  potentialText?: string | null;
  skillsText?: string | null;
  contractStatusText?: string | null;
  contactsText?: string | null;
  clubText?: string | null;
  pipelineStatus?: string | null;
  notes?: string | null;
  tags: string[];
  updatedAt: string;
};

type SyncChange = {
  field: string;
  label: string;
  current: string | null;
  next: string | null;
};

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : "");

export default function ClubWorkingDetailPage() {
  const params = useParams();
  const cardId = params?.id as string;
  const [card, setCard] = useState<WorkingCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [syncChanges, setSyncChanges] = useState<SyncChange[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});

  const load = async () => {
    if (!cardId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<WorkingCard>(`/working-cards/${cardId}`, { auth: true });
      setCard(data);
      setTagsInput((data.tags || []).join(", "));
    } catch {
      setError("Не удалось загрузить карточку");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId]);

  const updateField = (key: keyof WorkingCard, value: any) => {
    setCard((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        fullName: card.fullName,
        birthDate: card.birthDate ? toDateInput(card.birthDate) : undefined,
        cityText: card.cityText,
        positionText: card.positionText,
        cooperationUntil: card.cooperationUntil,
        potentialText: card.potentialText,
        skillsText: card.skillsText,
        contractStatusText: card.contractStatusText,
        contactsText: card.contactsText,
        clubText: card.clubText,
        pipelineStatus: card.pipelineStatus,
        notes: card.notes,
        tags: tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      };
      await apiFetch(`/working-cards/${card.id}`, { method: "PUT", body: payload, auth: true });
      setMessage("Карточка обновлена");
      load();
    } catch {
      setError("Не удалось сохранить карточку");
    } finally {
      setLoading(false);
    }
  };

  const loadSyncPreview = async () => {
    if (!card) return;
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<{ changes: SyncChange[] }>(`/working-cards/${card.id}/sync-preview`, {
        method: "POST",
        auth: true
      });
      setSyncChanges(data.changes || []);
      const defaults: Record<string, boolean> = {};
      (data.changes || []).forEach((change) => {
        defaults[change.field] = true;
      });
      setSelectedFields(defaults);
    } catch {
      setError("Не удалось получить список изменений");
    }
  };

  const applySync = async () => {
    if (!card) return;
    setError(null);
    setMessage(null);
    const fields = Object.keys(selectedFields).filter((key) => selectedFields[key]);
    try {
      await apiFetch(`/working-cards/${card.id}/sync-apply`, { method: "POST", body: { fields }, auth: true });
      setMessage("Данные синхронизированы");
      setSyncChanges([]);
      load();
    } catch {
      setError("Не удалось синхронизировать данные");
    }
  };

  const hasSyncChanges = useMemo(() => syncChanges.length > 0, [syncChanges]);

  if (!card && !loading && error) {
    return (
      <main className="min-h-screen bg-secondary">
        <div className="container py-12">
          <div className="card text-white/70">{error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Клуб • Карточка кандидата</p>
            <h1 className="text-3xl font-bold">Рабочая карточка</h1>
            <p className="text-white/70">Редактируемая копия агентской карточки кандидата.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <div className="flex gap-3">
            <Link href="/app/club/working" className="ghost-btn">
              К списку
            </Link>
            {card && (
              <Link href={`/app/club/players/${card.playerId}`} className="ghost-btn">
                Профиль игрока
              </Link>
            )}
          </div>
        </div>

        {card && (
          <form className="space-y-6" onSubmit={save}>
            <div className="card grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-white/80">
                <span>ФИО</span>
                <input
                  className="input"
                  value={card.fullName || ""}
                  onChange={(e) => updateField("fullName", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>Дата рождения</span>
                <input
                  type="date"
                  className="input"
                  value={toDateInput(card.birthDate)}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>Город</span>
                <input
                  className="input"
                  value={card.cityText || ""}
                  onChange={(e) => updateField("cityText", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>Амплуа</span>
                <input
                  className="input"
                  value={card.positionText || ""}
                  onChange={(e) => updateField("positionText", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>Клуб</span>
                <input
                  className="input"
                  value={card.clubText || ""}
                  onChange={(e) => updateField("clubText", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>Сотрудничество</span>
                <input
                  className="input"
                  value={card.cooperationUntil || ""}
                  onChange={(e) => updateField("cooperationUntil", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Потенциал</span>
                <textarea
                  className="input min-h-[100px]"
                  value={card.potentialText || ""}
                  onChange={(e) => updateField("potentialText", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Скиллы</span>
                <textarea
                  className="input min-h-[100px]"
                  value={card.skillsText || ""}
                  onChange={(e) => updateField("skillsText", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Состояние контракта</span>
                <textarea
                  className="input min-h-[80px]"
                  value={card.contractStatusText || ""}
                  onChange={(e) => updateField("contractStatusText", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Контакты</span>
                <textarea
                  className="input min-h-[80px]"
                  value={card.contactsText || ""}
                  onChange={(e) => updateField("contactsText", e.target.value)}
                />
              </label>
            </div>

            <div className="card grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-white/80">
                <span>Этап</span>
                <input
                  className="input"
                  value={card.pipelineStatus || ""}
                  onChange={(e) => updateField("pipelineStatus", e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm text-white/80">
                <span>Теги</span>
                <input
                  className="input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Напр. приоритет, просмотр"
                />
              </label>
              <label className="space-y-1 text-sm text-white/80 md:col-span-2">
                <span>Заметки</span>
                <textarea
                  className="input min-h-[120px]"
                  value={card.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                />
              </label>
            </div>

            <div className="card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="pill mb-2">Синхронизация</p>
                  <h2 className="text-xl font-semibold">Обновить из профиля игрока</h2>
                  <p className="text-sm text-white/70">Проверьте, какие поля изменились в профиле.</p>
                </div>
                <button type="button" className="ghost-btn" onClick={loadSyncPreview}>
                  Показать изменения
                </button>
              </div>

              {hasSyncChanges ? (
                <div className="space-y-3">
                  {syncChanges.map((change) => (
                    <label key={change.field} className="flex flex-col gap-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">{change.label}</span>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedFields[change.field])}
                          onChange={(e) =>
                            setSelectedFields((prev) => ({
                              ...prev,
                              [change.field]: e.target.checked
                            }))
                          }
                        />
                      </div>
                      <div className="text-xs text-white/50">Текущее: {change.current ?? "-"}</div>
                      <div className="text-xs text-white/70">Новое: {change.next ?? "-"}</div>
                    </label>
                  ))}
                  <button type="button" className="primary-btn px-5 py-2 text-sm" onClick={applySync}>
                    Применить выбранные поля
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/60">Нет изменений для синхронизации.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button className="primary-btn px-6 py-3 text-sm" type="submit" disabled={loading}>
                Сохранить
              </button>
              <button className="ghost-btn px-6 py-3 text-sm" type="button" onClick={load}>
                Обновить
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
