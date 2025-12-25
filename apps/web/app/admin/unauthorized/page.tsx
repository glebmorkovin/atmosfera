"use client";

import Link from "next/link";

export default function AdminUnauthorizedPage() {
  return (
    <main className="min-h-screen bg-secondary">
      <div className="container py-16">
        <div className="card space-y-3 text-center">
          <p className="pill w-fit mx-auto">Доступ ограничен</p>
          <h1 className="text-2xl font-semibold">Нет прав на просмотр</h1>
          <p className="text-white/70">Войдите как администратор или вернитесь в админку.</p>
          <Link href="/admin/dashboard" className="primary-btn mx-auto w-fit px-6 py-2">
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
