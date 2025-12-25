"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutClient } from "@/lib/api-client";

const adminLinks = [
  { href: "/admin/dashboard", label: "Админ" },
  { href: "/admin/vacancies", label: "Модерация вакансий" },
  { href: "/admin/players", label: "Профили" },
  { href: "/admin/media", label: "Медиа" },
  { href: "/admin/refs", label: "Справочники" },
  { href: "/admin/audit", label: "Журнал" }
];

export function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    if (!window.confirm("Вы точно хотите выйти из аккаунта?")) return;
    await logoutClient();
    router.replace("/auth/login");
  };

  return (
    <header className="border-b border-white/10 bg-black/50">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/admin/dashboard" className="text-lg font-semibold">
          Админка
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-white/80">
          {adminLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-white/70 hover:text-white">
            Публичный сайт
          </Link>
          <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white">
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
