"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { getStoredRole, roleHome, saveRole, saveTokens } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/alert";

const roles = [
  { value: "player", label: "Игрок" },
  { value: "parent", label: "Родитель" },
  { value: "scout", label: "Скаут" },
  { value: "club", label: "Клуб" }
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
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedRole = getStoredRole();
    if (storedRole) {
      router.replace(roleHome(storedRole));
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError({ message: "Заполните email, имя и фамилию." });
      return;
    }
    if (!password.trim() || password.length < 8) {
      setError({ message: "Пароль должен быть не короче 8 символов." });
      return;
    }
    if (password !== password2) {
      setError({ message: "Пароли не совпадают." });
      return;
    }
    setLoading(true);
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken?: string }>("/auth/register", {
        method: "POST",
        body: { email, password, role, firstName, lastName, country, city }
      });
      if (typeof window !== "undefined") {
        saveTokens(data.accessToken);
        let nextRole: string | undefined = role;
        try {
          const me = await apiFetch<{ role: string }>("/users/me", { auth: true });
          nextRole = me.role || nextRole;
        } catch {
          // fallback to role from form
        }
        saveRole(nextRole);
        if (nextRole) {
          router.push(roleHome(nextRole));
        }
      }
      setMessage("Аккаунт создан. Перенаправляем в кабинет.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ message: err.message || "Ошибка регистрации", requestId: err.requestId });
      } else {
        setError({ message: err instanceof Error ? err.message : "Ошибка регистрации" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-6 space-y-2">
        <p className="pill w-fit">Регистрация</p>
        <h1 className="text-2xl font-semibold">Создать аккаунт</h1>
        <p className="text-sm text-white/70">Заполните данные и получите доступ к кабинету.</p>
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
            <span>Выберите, кто вы</span>
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
      {message && <Alert variant="success" description={message} className="mt-4" />}
      {error && <Alert variant="error" description={error.message} requestId={error.requestId} className="mt-4" />}
      <p className="mt-6 text-center text-sm text-white/70">
        Уже есть аккаунт?{" "}
        <Link href="/auth/login" className="text-primary">
          Войти
        </Link>
      </p>
    </div>
  );
}
