"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { saveRole } from "@/lib/auth";

const roles = [
  { value: "player", label: "Я игрок" },
  { value: "parent", label: "Я родитель" },
  { value: "scout", label: "Я скаут/клуб" },
  { value: "agent", label: "Я агент" }
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("player");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (password !== password2) {
      setError("Пароли не совпадают");
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/register", {
        method: "POST",
        body: { email, password, role, firstName, lastName, country, city }
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        saveRole(role);
      }
      setMessage("Аккаунт создан, токены сохранены. Можно заходить в кабинеты.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-6 space-y-2">
        <p className="pill w-fit">Регистрация</p>
        <h1 className="text-2xl font-semibold">Создать аккаунт</h1>
        <p className="text-sm text-white/70">После регистрации получите токены и сможете использовать демо-API.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-white/80">
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="space-y-1 text-sm text-white/80">
            <span>Роль</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-white/80">
            <span>Имя</span>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Имя"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="space-y-1 text-sm text-white/80">
            <span>Фамилия</span>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Фамилия"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="space-y-1 text-sm text-white/80">
            <span>Страна</span>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Россия"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
          <label className="space-y-1 text-sm text-white/80">
            <span>Город</span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Москва"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>
        </div>
        <label className="space-y-1 text-sm text-white/80">
          <span>Пароль</span>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 8 символов"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-sm text-white/80">
          <span>Повтор пароля</span>
          <input
            type="password"
            required
            minLength={8}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Повторите пароль"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-white/80">
          <input type="checkbox" className="h-4 w-4 accent-primary" required /> Я согласен с условиями сервиса
        </label>
        <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
          {loading ? "Отправляем..." : "Зарегистрироваться"}
        </button>
      </form>
      {message && <p className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>}
      <p className="mt-6 text-center text-sm text-white/70">
        Уже есть аккаунт?{" "}
        <Link href="/auth/login" className="text-primary">
          Войти
        </Link>
      </p>
    </div>
  );
}
