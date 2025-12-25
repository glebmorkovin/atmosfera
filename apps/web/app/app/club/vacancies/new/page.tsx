"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

const vacancyTypes = [
  { value: "TRYOUT", label: "Просмотр" },
  { value: "CONTRACT", label: "Контракт" },
  { value: "ACADEMY", label: "Академия" },
  { value: "VIEWING", label: "Просмотр игроков" },
  { value: "OTHER", label: "Другое" }
];

const contactModes = [
  { value: "platform_only", label: "Только через платформу" },
  { value: "contacts_after_review", label: "Контакты после рассмотрения" },
  { value: "direct", label: "Можно указать контакты" }
];

const parsePositions = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));

const emptyToUndefined = (value: string) => (value.trim() === "" ? undefined : value);

export default function ClubVacancyNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "OTHER",
    positions: "",
    ageFrom: "",
    ageTo: "",
    locationCountry: "",
    locationCity: "",
    leagueId: "",
    description: "",
    requirements: "",
    conditions: "",
    applicationDeadline: "",
    contactMode: "platform_only"
  });

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        title: form.title,
        type: form.type || undefined,
        positions: parsePositions(form.positions),
        ageFrom: toNumber(form.ageFrom),
        ageTo: toNumber(form.ageTo),
        locationCountry: emptyToUndefined(form.locationCountry),
        locationCity: emptyToUndefined(form.locationCity),
        leagueId: emptyToUndefined(form.leagueId),
        description: form.description,
        requirements: emptyToUndefined(form.requirements),
        conditions: emptyToUndefined(form.conditions),
        applicationDeadline: emptyToUndefined(form.applicationDeadline),
        contactMode: emptyToUndefined(form.contactMode)
      };
      const created = await apiFetch<{ id: string }>("/club/vacancies", {
        method: "POST",
        body: payload,
        auth: true
      });
      setMessage("Черновик создан");
      router.push(`/app/club/vacancies/${created.id}/edit`);
    } catch {
      setError("Не удалось создать вакансию");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Клуб • Вакансии</p>
            <h1 className="text-3xl font-bold">Создать вакансию</h1>
            <p className="text-white/70">Заполните описание и сохраните черновик.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            {loading && <p className="text-sm text-white/60">Сохранение...</p>}
          </div>
          <Link href="/app/club/vacancies" className="ghost-btn">
            К списку
          </Link>
        </div>

        <form className="space-y-6" onSubmit={submit}>
          <div className="card grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm text-white/80 md:col-span-2">
              <span>Название</span>
              <input
                className="input"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Тип</span>
              <select className="input" value={form.type} onChange={(e) => updateField("type", e.target.value)}>
                {vacancyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Позиции (через запятую)</span>
              <input
                className="input"
                value={form.positions}
                onChange={(e) => updateField("positions", e.target.value)}
                placeholder="CB, RB, ST"
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Возраст от</span>
              <input
                type="number"
                className="input"
                value={form.ageFrom}
                onChange={(e) => updateField("ageFrom", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Возраст до</span>
              <input
                type="number"
                className="input"
                value={form.ageTo}
                onChange={(e) => updateField("ageTo", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Страна</span>
              <input
                className="input"
                value={form.locationCountry}
                onChange={(e) => updateField("locationCountry", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Город</span>
              <input
                className="input"
                value={form.locationCity}
                onChange={(e) => updateField("locationCity", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Лига (ID, опционально)</span>
              <input
                className="input"
                value={form.leagueId}
                onChange={(e) => updateField("leagueId", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80">
              <span>Дедлайн откликов</span>
              <input
                type="date"
                className="input"
                value={form.applicationDeadline}
                onChange={(e) => updateField("applicationDeadline", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80 md:col-span-2">
              <span>Описание</span>
              <textarea
                className="input min-h-[140px]"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                required
              />
            </label>
            <label className="space-y-1 text-sm text-white/80 md:col-span-2">
              <span>Требования</span>
              <textarea
                className="input min-h-[120px]"
                value={form.requirements}
                onChange={(e) => updateField("requirements", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80 md:col-span-2">
              <span>Условия</span>
              <textarea
                className="input min-h-[120px]"
                value={form.conditions}
                onChange={(e) => updateField("conditions", e.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm text-white/80 md:col-span-2">
              <span>Контакты / политика связи</span>
              <select
                className="input"
                value={form.contactMode}
                onChange={(e) => updateField("contactMode", e.target.value)}
              >
                {contactModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button className="primary-btn" type="submit" disabled={loading}>
              Сохранить черновик
            </button>
            <Link href="/app/club/vacancies" className="ghost-btn">
              Отмена
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
