"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredRole, roleHome, UserRole } from "@/lib/auth";

const navByRole: Record<UserRole, { href: string; label: string }[]> = {
  PLAYER: [
    { href: "/player/dashboard", label: "Игрок" },
    { href: "/player/profile", label: "Профиль" },
    { href: "/player/stats", label: "Статистика" },
    { href: "/player/media", label: "Медиа" }
  ],
  PARENT: [
    { href: "/player/dashboard", label: "Игрок (родитель)" },
    { href: "/player/profile", label: "Профиль" }
  ],
  SCOUT: [
    { href: "/scout", label: "Скаут" },
    { href: "/scout/search", label: "Поиск" },
    { href: "/scout/shortlists", label: "Шортлисты" }
  ],
  AGENT: [
    { href: "/scout", label: "Клуб/Агент" },
    { href: "/scout/search", label: "Поиск" },
    { href: "/scout/shortlists", label: "Шортлисты" }
  ],
  ADMIN: [{ href: "/admin", label: "Админ" }],
  CLUB: [
    { href: "/scout", label: "Клуб" },
    { href: "/scout/search", label: "Поиск" },
    { href: "/scout/shortlists", label: "Шортлисты" }
  ]
};

export function RoleAwareNav({ children }: { children?: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

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
      {children}
    </nav>
  );
}
