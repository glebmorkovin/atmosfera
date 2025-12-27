"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { Alert } from "@/components/alert";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; requestId?: string } | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!email.trim()) {
      setError({ message: "Введите email, чтобы получить ссылку." });
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-request", {
        method: "POST",
        body: { email }
      });
      setMessage("Если адрес зарегистрирован, мы отправим ссылку на почту.");
    } catch (err) {
      if (err instanceof ApiError) {
        setError({ message: err.message || "Ошибка запроса", requestId: err.requestId });
      } else {
        setError({ message: err instanceof Error ? err.message : "Ошибка запроса" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="mb-6 space-y-2">
        <p className="pill w-fit">Восстановление</p>
        <h1 className="text-2xl font-semibold">Восстановить пароль</h1>
        <p className="text-sm text-white/70">Если адрес зарегистрирован, мы отправим ссылку на почту.</p>
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
      {message && <Alert variant="success" description={message} className="mt-4" />}
      {error && <Alert variant="error" description={error.message} requestId={error.requestId} className="mt-4" />}
      <p className="mt-6 text-center text-sm text-white/70">
        Вспомнили пароль?{" "}
        <Link href="/auth/login" className="text-primary">
          Войти
        </Link>
      </p>
    </div>
  );
}
