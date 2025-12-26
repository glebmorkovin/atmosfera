"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";

type PlayerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth?: string;
  city?: string | null;
  country?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isPublicInSearch?: boolean;
  showContactsToScoutsOnly?: boolean;
};

const positions = [
  { value: "C", label: "Центр" },
  { value: "LW", label: "Левый край" },
  { value: "RW", label: "Правый край" },
  { value: "D", label: "Защитник" },
  { value: "G", label: "Вратарь" }
];

type Props = {
  playerId: string;
  mode: "view" | "edit";
};

export function ChildProfile({ playerId, mode }: Props) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [draft, setDraft] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<PlayerProfile>(`/players/${playerId}`, { auth: true });
      setProfile(data);
      setDraft(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateDraft = (key: keyof PlayerProfile, value: string | boolean) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<PlayerProfile>(`/players/${playerId}`, {
        method: "PUT",
        auth: true,
        body: {
          firstName: draft.firstName,
          lastName: draft.lastName,
          position: draft.position,
          country: draft.country,
          city: draft.city,
          contactEmail: draft.contactEmail || null,
          contactPhone: draft.contactPhone || null,
          isPublicInSearch: Boolean(draft.isPublicInSearch),
          showContactsToScoutsOnly: Boolean(draft.showContactsToScoutsOnly)
        }
      });
      setProfile(data);
      setDraft(data);
      setMessage("Профиль обновлён");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="pill mb-2">Родитель • Профиль ребёнка</p>
            <h1 className="text-3xl font-bold">{profile ? `${profile.firstName} ${profile.lastName}` : "Профиль"}</h1>
            <p className="text-white/70">Управляйте основными данными ребёнка.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <div className="flex gap-3">
            {mode === "view" ? (
              <Link href={`/app/parent/children/${playerId}/edit`} className="primary-btn">
                Редактировать
              </Link>
            ) : (
              <Link href={`/app/parent/children/${playerId}`} className="ghost-btn">
                Отмена
              </Link>
            )}
            <Link href="/app/parent/children" className="ghost-btn">
              К списку
            </Link>
          </div>
        </div>

        {!profile && !loading && <div className="card text-white/70">Профиль не найден.</div>}

        {profile && mode === "view" && (
          <div className="card grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-white/60">Имя</p>
              <p className="text-lg font-semibold">{profile.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Фамилия</p>
              <p className="text-lg font-semibold">{profile.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Позиция</p>
              <p className="text-white/80">{profile.position || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Дата рождения</p>
              <p className="text-white/80">
                {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("ru-RU") : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/60">Страна</p>
              <p className="text-white/80">{profile.country || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Город</p>
              <p className="text-white/80">{profile.city || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Контактный email</p>
              <p className="text-white/80">{profile.contactEmail || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-white/60">Телефон</p>
              <p className="text-white/80">{profile.contactPhone || "—"}</p>
            </div>
          </div>
        )}

        {profile && mode === "edit" && draft && (
          <form onSubmit={submit} className="card grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-white/80">
              <span>Имя</span>
              <input
                className="input"
                value={draft.firstName}
                onChange={(e) => updateDraft("firstName", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Фамилия</span>
              <input
                className="input"
                value={draft.lastName}
                onChange={(e) => updateDraft("lastName", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Позиция</span>
              <select
                className="input"
                value={draft.position}
                onChange={(e) => updateDraft("position", e.target.value)}
                required
              >
                <option value="">Выберите позицию</option>
                {positions.map((pos) => (
                  <option key={pos.value} value={pos.value}>
                    {pos.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Дата рождения</span>
              <input className="input" value={draft.dateOfBirth ? draft.dateOfBirth.slice(0, 10) : ""} disabled />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Страна</span>
              <input
                className="input"
                value={draft.country || ""}
                onChange={(e) => updateDraft("country", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Город</span>
              <input
                className="input"
                value={draft.city || ""}
                onChange={(e) => updateDraft("city", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Контактный email</span>
              <input
                className="input"
                type="email"
                value={draft.contactEmail || ""}
                onChange={(e) => updateDraft("contactEmail", e.target.value)}
                placeholder="email@example.com"
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Телефон</span>
              <input
                className="input"
                value={draft.contactPhone || ""}
                onChange={(e) => updateDraft("contactPhone", e.target.value)}
                placeholder="+7..."
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={Boolean(draft.isPublicInSearch)}
                onChange={(e) => updateDraft("isPublicInSearch", e.target.checked)}
              />
              Показывать в поиске
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={Boolean(draft.showContactsToScoutsOnly)}
                onChange={(e) => updateDraft("showContactsToScoutsOnly", e.target.checked)}
              />
              Контакты только для скаутов/клубов
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Сохраняем..." : "Сохранить"}
              </button>
              <Link href={`/app/parent/children/${playerId}`} className="ghost-btn">
                Отмена
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
