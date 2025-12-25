"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredRole, roleHome } from "@/lib/auth";

export default function AppNotFound() {
  const [home, setHome] = useState("/");

  useEffect(() => {
    const role = getStoredRole();
    setHome(role ? roleHome(role) : "/");
  }, []);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container py-16">
        <div className="card space-y-3 text-center">
          <p className="pill w-fit mx-auto">404</p>
          <h1 className="text-2xl font-semibold">Страница не найдена</h1>
          <p className="text-white/70">Такого адреса нет или страница была перемещена.</p>
          <Link href={home} className="primary-btn mx-auto w-fit px-6 py-2">
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
