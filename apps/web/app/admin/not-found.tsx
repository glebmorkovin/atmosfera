"use client";

import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main className="min-h-screen bg-secondary">
      <div className="container py-16">
        <div className="card space-y-3 text-center">
          <p className="pill w-fit mx-auto">404</p>
          <h1 className="text-2xl font-semibold">Страница не найдена</h1>
          <p className="text-white/70">Страница не найдена. Вернитесь в админку и продолжайте работу.</p>
          <Link href="/admin/dashboard" className="primary-btn mx-auto w-fit px-6 py-2">
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
