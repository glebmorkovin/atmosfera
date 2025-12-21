"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredRole, roleHome, UserRole } from "@/lib/auth";
import { logoutClient } from "@/lib/api-client";

const navByRole: Record<UserRole, { href: string; label: string }[]> = {
  PLAYER: [
    { href: "/app/player/dashboard", label: "Дашборд" },
    { href: "/app/player/profile", label: "Профиль" },
    { href: "/app/player/profile/edit", label: "Редактировать профиль" },
    { href: "/app/player/stats", label: "Статистика" },
    { href: "/app/player/media", label: "Медиа" },
    { href: "/app/player/requests", label: "Запросы" },
    { href: "/app/player/applications", label: "Отклики" },
    { href: "/app/player/settings", label: "Настройки" }
  ],
  PARENT: [
    { href: "/app/parent/dashboard", label: "Дашборд" },
    { href: "/app/parent/children", label: "Дети" },
    { href: "/app/parent/requests", label: "Запросы" },
    { href: "/app/parent/applications", label: "Отклики" },
    { href: "/app/parent/settings", label: "Настройки" }
  ],
  SCOUT: [
    { href: "/app/scout/dashboard", label: "Дашборд" },
    { href: "/app/scout/search", label: "Поиск игроков" },
    { href: "/app/scout/shortlists", label: "Шортлисты" },
    { href: "/app/scout/working", label: "Мои игроки" },
    { href: "/app/scout/requests", label: "Запросы" },
    { href: "/app/scout/settings", label: "Настройки" }
  ],
  CLUB: [
    { href: "/app/club/dashboard", label: "Дашборд" },
    { href: "/app/club/search", label: "Поиск игроков" },
    { href: "/app/club/shortlists", label: "Шортлисты" },
    { href: "/app/club/working", label: "Кандидаты в работе" },
    { href: "/app/club/vacancies", label: "Вакансии" },
    { href: "/app/club/requests", label: "Запросы" },
    { href: "/app/club/settings", label: "Настройки" }
  ],
  ADMIN: [
    { href: "/admin/dashboard", label: "Админ" },
    { href: "/admin/players", label: "Профили игроков" },
    { href: "/admin/media", label: "Медиа" },
    { href: "/admin/refs", label: "Справочники" },
    { href: "/admin/audit", label: "Журнал" }
  ]
};

export function RoleAwareNav({ children }: { children?: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  const handleLogout = () => {
    if (!window.confirm("Вы точно хотите выйти из аккаунта?")) return;
    logoutClient();
    setRole(null);
    router.replace("/");
  };

  if (!role) {
    return (
      <nav className="flex items-center gap-4 text-sm text-white/80">
        <Link href="/auth/login">Войти</Link>
        <Link href="/auth/register">Регистрация</Link>
        {children}
      </nav>
    );
  }

  const items = navByRole[role] || [];

  return (
    <nav className="flex items-center gap-4 text-sm text-white/80">
      {items.map((item) => (
        <Link key={item.href} href={item.href}>
          {item.label}
        </Link>
      ))}
      <button type="button" onClick={handleLogout} className="text-white/70 hover:text-white">
        Выйти
      </button>
      {children}
    </nav>
  );
}
