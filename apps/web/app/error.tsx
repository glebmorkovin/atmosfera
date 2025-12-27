"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredRole, roleHome } from "@/lib/auth";

export default function GlobalError({ reset }: { reset: () => void }) {
  const [home, setHome] = useState("/");

  useEffect(() => {
    const role = getStoredRole();
    setHome(role ? roleHome(role) : "/");
  }, []);

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container py-16">
        <div className="card space-y-3 text-center">
          <p className="pill w-fit mx-auto">Ошибка</p>
          <h1 className="text-2xl font-semibold">Что-то пошло не так</h1>
          <p className="text-white/70">Попробуйте обновить страницу или вернуться на главную.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button className="primary-btn px-6 py-2" onClick={reset}>
              Повторить
            </button>
            <Link href={home} className="ghost-btn px-6 py-2">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
