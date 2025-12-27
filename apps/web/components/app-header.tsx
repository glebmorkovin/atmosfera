"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NotificationsIndicator } from "@/components/notifications-indicator";
import { ApiError, apiFetch, logoutClient } from "@/lib/api-client";
import { getStoredRole, roleHome, UserRole } from "@/lib/auth";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const shouldRender =
    pathname?.startsWith("/app") || pathname?.startsWith("/admin") || pathname?.startsWith("/notifications");
  const navItems = useMemo(() => {
    if (!role) return [];
    const items: Record<UserRole, { href: string; label: string }[]> = {
      PLAYER: [
        { href: "/app/player/profile", label: "Профиль" },
        { href: "/app/player/stats", label: "Статистика" },
        { href: "/app/player/media", label: "Медиа" },
        { href: "/app/player/requests", label: "Запросы" },
        { href: "/app/player/applications", label: "Отклики" },
        { href: "/app/player/settings", label: "Настройки" }
      ],
      PARENT: [
        { href: "/app/parent/children", label: "Дети" },
        { href: "/app/parent/requests", label: "Запросы" },
        { href: "/app/parent/applications", label: "Отклики" },
        { href: "/app/parent/settings", label: "Настройки" }
      ],
      SCOUT: [
        { href: "/app/scout/search", label: "Поиск" },
        { href: "/app/scout/shortlists", label: "Шортлисты" },
        { href: "/app/scout/working", label: "Игроки в работе" },
        { href: "/app/scout/requests", label: "Запросы" },
        { href: "/app/scout/settings", label: "Настройки" }
      ],
      CLUB: [
        { href: "/app/club/search", label: "Поиск" },
        { href: "/app/club/shortlists", label: "Шортлисты" },
        { href: "/app/club/working", label: "Игроки в работе" },
        { href: "/app/club/requests", label: "Запросы" },
        { href: "/app/club/vacancies", label: "Вакансии" },
        { href: "/app/club/settings", label: "Настройки" }
      ],
      ADMIN: [
        { href: "/admin/vacancies", label: "Модерация вакансий" },
        { href: "/admin/players", label: "Профили" },
        { href: "/admin/media", label: "Медиа" },
        { href: "/admin/refs", label: "Справочники" },
        { href: "/admin/audit", label: "Журнал" }
      ]
    };
    return items[role] || [];
  }, [role]);

  const roleLabel = useMemo(() => {
    if (!role) return "Гость";
    const labels: Record<UserRole, string> = {
      PLAYER: "Игрок",
      PARENT: "Родитель",
      SCOUT: "Скаут",
      CLUB: "Клуб",
      ADMIN: "Админ"
    };
    return labels[role];
  }, [role]);

  useEffect(() => {
    if (!shouldRender) return;
    setRole(getStoredRole());
  }, [pathname, shouldRender]);

  useEffect(() => {
    if (!role) return;
    apiFetch<{ firstName?: string; lastName?: string; role?: UserRole }>("/users/me", { auth: true })
      .then((data) => {
        const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
        if (name) setDisplayName(name);
        if (data.role && data.role !== role) {
          setRole(data.role);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setRole(null);
        }
      });
  }, [role]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutClient();
    setRole(null);
    setDisplayName(null);
    router.replace("/auth/login");
  };

  if (!shouldRender) return null;

  return (
    <header className="border-b border-white/10 bg-black/50">
      <div className="container flex items-center justify-between py-4">
        <Link href={role ? roleHome(role) : "/"} className="text-lg font-semibold">
          Атмосфера
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-white/80 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {role && role !== "ADMIN" && (
            <Link href="/notifications" className="hidden items-center gap-1 text-white/80 hover:text-white md:flex">
              Уведомления
              <NotificationsIndicator />
            </Link>
          )}
          {role === "ADMIN" && (
            <Link href="/" className="hidden text-white/70 hover:text-white md:flex">
              Публичный сайт
            </Link>
          )}
          {role && (
            <div className="hidden flex-col items-end text-xs text-white/60 md:flex">
              <span>{roleLabel}</span>
              <span className="text-sm text-white/80">{displayName || "Аккаунт"}</span>
            </div>
          )}
          {role && (
            <button type="button" onClick={handleLogout} className="hidden text-white/70 hover:text-white md:flex">
              Выйти
            </button>
          )}
          <button
            type="button"
            className="ghost-btn px-3 py-2 text-xs md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            Меню
          </button>
        </div>
      </div>
      {menuOpen && (
        <div className="border-t border-white/10 bg-black/60 md:hidden">
          <div className="container flex flex-col gap-3 py-4 text-sm text-white/80">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            {role && role !== "ADMIN" && (
              <Link href="/notifications" className="flex items-center gap-1" onClick={() => setMenuOpen(false)}>
                Уведомления
                <NotificationsIndicator />
              </Link>
            )}
            {role === "ADMIN" && (
              <Link href="/" onClick={() => setMenuOpen(false)}>
                Публичный сайт
              </Link>
            )}
            {role && (
              <div className="text-xs text-white/60">
                {roleLabel} · {displayName || "Аккаунт"}
              </div>
            )}
            {role && (
              <button type="button" onClick={handleLogout} className="text-left text-white/80">
                Выйти
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
