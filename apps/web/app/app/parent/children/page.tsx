"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { Alert } from "@/components/alert";
import { LoadingState } from "@/components/loading-state";

type ChildProfile = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  dateOfBirth?: string;
  city?: string;
  country?: string;
};

const positions = [
  { value: "C", label: "Центр" },
  { value: "LW", label: "Левый край" },
  { value: "RW", label: "Правый край" },
  { value: "D", label: "Защитник" },
  { value: "G", label: "Вратарь" }
];

export default function ParentChildrenPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    position: "",
    country: "",
    city: "",
    email: ""
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<ChildProfile[]>("/players/parent/children", { auth: true });
      setChildren(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить профили детей");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      position: "",
      country: "",
      city: "",
      email: ""
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth || !form.position) {
      setError("Заполните обязательные поля профиля ребёнка.");
      setSaving(false);
      return;
    }
    try {
      await apiFetch("/players/parent/children", {
        method: "POST",
        auth: true,
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          position: form.position,
          country: form.country,
          city: form.city,
          email: form.email || undefined
        }
      });
      setMessage("Профиль ребёнка создан.");
      resetForm();
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось добавить ребёнка");
    } finally {
      setSaving(false);
    }
  };

  const unlink = async (playerId: string) => {
    if (!confirm("Отвязать профиль ребёнка от вашего аккаунта?")) return;
    setError(null);
    setMessage(null);
    try {
      await apiFetch(`/players/parent/children/${playerId}`, { method: "DELETE", auth: true });
      setMessage("Профиль отвязан.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отвязать профиль");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="pill mb-2">Родитель • Дети</p>
            <h1 className="text-3xl font-bold">Профили детей</h1>
            <p className="text-white/70">Добавляйте и управляйте профилями детей в одном месте.</p>
          </div>
          <div className="flex gap-3">
            <button className="primary-btn" onClick={() => setShowForm((prev) => !prev)}>
              {showForm ? "Скрыть форму" : "Добавить ребёнка"}
            </button>
            <Link href="/app/parent/dashboard" className="ghost-btn">
              В дашборд
            </Link>
          </div>
        </div>

        {error && <Alert variant="warning" description={error} />}
        {message && <Alert variant="success" description={message} />}
        {loading && <LoadingState title="Загружаем профили..." subtitle="Собираем данные по детям." lines={4} />}

        {showForm && (
          <form onSubmit={submit} className="card grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-white/80">
              <span>Имя</span>
              <input
                className="input"
                value={form.firstName}
                onChange={(e) => updateForm("firstName", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Фамилия</span>
              <input
                className="input"
                value={form.lastName}
                onChange={(e) => updateForm("lastName", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Дата рождения</span>
              <input
                type="date"
                className="input"
                value={form.dateOfBirth}
                onChange={(e) => updateForm("dateOfBirth", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Позиция</span>
              <select
                className="input"
                value={form.position}
                onChange={(e) => updateForm("position", e.target.value)}
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
              <span>Страна</span>
              <input
                className="input"
                value={form.country}
                onChange={(e) => updateForm("country", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Город</span>
              <input
                className="input"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80 md:col-span-2">
              <span>Email ребёнка (опционально)</span>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="email@example.com"
              />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Сохраняем..." : "Создать профиль"}
              </button>
              <button
                className="ghost-btn"
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {children.length === 0 && !loading && !showForm && (
          <div className="card text-white/70">Добавьте первого ребёнка, чтобы начать работу с профилями.</div>
        )}

        <div className="grid gap-4">
          {children.map((child) => (
            <div key={child.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {child.firstName} {child.lastName}
                </h3>
                <p className="text-sm text-white/60">
                  {child.position} · {child.city || "—"}, {child.country || "—"}
                </p>
                {child.dateOfBirth && (
                  <p className="text-xs text-white/50">Дата рождения: {new Date(child.dateOfBirth).toLocaleDateString("ru-RU")}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/app/parent/children/${child.id}`} className="ghost-btn px-3 py-2 text-sm">
                  Открыть профиль
                </Link>
                <Link href={`/app/parent/children/${child.id}/edit`} className="ghost-btn px-3 py-2 text-sm">
                  Редактировать
                </Link>
                <button className="ghost-btn px-3 py-2 text-sm" onClick={() => unlink(child.id)}>
                  Отвязать
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
