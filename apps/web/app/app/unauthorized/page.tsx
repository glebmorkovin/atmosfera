"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredRole, roleHome } from "@/lib/auth";

export default function AppUnauthorizedPage() {
  const [home, setHome] = useState("/");

  useEffect(() => {
    const role = getStoredRole();
    setHome(role ? roleHome(role) : "/");
  }, []);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container py-16">
        <div className="card space-y-3 text-center">
          <p className="pill w-fit mx-auto">Доступ ограничен</p>
          <h1 className="text-2xl font-semibold">Нет прав на просмотр</h1>
          <p className="text-white/70">Эта страница недоступна для вашей роли. Вернитесь на главную.</p>
          <Link href={home} className="primary-btn mx-auto w-fit px-6 py-2">
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
