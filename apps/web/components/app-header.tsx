"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsIndicator } from "@/components/notifications-indicator";
import { RoleAwareNav } from "@/components/role-aware-nav";

export function AppHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="border-b border-white/10 bg-black/50">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="text-lg font-semibold">
          Атмосфера
        </Link>
        <RoleAwareNav>
          <Link href="/notifications" className="flex items-center gap-1">
            Уведомления
            <NotificationsIndicator />
          </Link>
        </RoleAwareNav>
      </div>
    </header>
  );
}
