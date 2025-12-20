"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getStoredRole, roleHome, saveRole } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const role = getStoredRole();
    if (role) {
      router.replace(roleHome(role));
    }
  }, [router]);

  const redirectByRole = (role?: string) => {
    if (!role) return;
    if (role === "ADMIN") return router.push("/admin");
    if (role === "SCOUT" || role === "AGENT") return router.push("/scout");
    return router.push("/player/dashboard");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string; user?: { role?: string } }>("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        saveRole(data.user?.role);
      }
      setMessage("Успех: токены сохранены. Перенаправляем...");
      redirectByRole(data.user?.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-6 space-y-2">
        <p className="pill w-fit">Вход</p>
        <h1 className="text-2xl font-semibold">Войти в аккаунт</h1>
        <p className="text-sm text-white/70">
          Демо-логины: player@example.com / scout@example.com / admin@example.com (пароль: password123).
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-1 text-sm text-white/80">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <label className="space-y-1 text-sm text-white/80">
          <span>Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span />
          <Link href="/auth/reset" className="text-primary">
            Забыли пароль?
          </Link>
        </div>
        <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>
      {message && <p className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>}
      <p className="mt-6 text-center text-sm text-white/70">
        Нет аккаунта?{" "}
        <Link href="/auth/register" className="text-primary">
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
