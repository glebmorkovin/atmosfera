"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/reset-request", {
        method: "POST",
        body: { email }
      });
      setMessage("Если такой email есть, отправили ссылку (токен появится в консоли API).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-6 space-y-2">
        <p className="pill w-fit">Восстановление</p>
        <h1 className="text-2xl font-semibold">Сброс пароля</h1>
        <p className="text-sm text-white/70">Введите email для запроса ссылки на сброс.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
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
        <button type="submit" className="primary-btn w-full justify-center" disabled={loading}>
          {loading ? "Отправляем..." : "Отправить ссылку"}
        </button>
      </form>
      {message && <p className="mt-4 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">{message}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-200">{error}</p>}
      <p className="mt-6 text-center text-sm text-white/70">
        Вспомнили пароль?{" "}
        <Link href="/auth/login" className="text-primary">
          Войти
        </Link>
      </p>
    </div>
  );
}
