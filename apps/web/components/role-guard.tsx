/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getStoredRole, roleHome, UserRole } from "@/lib/auth";

type Props = {
  allowed: UserRole[];
  children: React.ReactNode;
};

export function RoleGuard({ allowed, children }: Props) {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const current = getStoredRole();
    setRole(current);
    if (!current) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allowed.includes(current)) {
      router.replace(roleHome(current));
    }
  }, [pathname]);

  if (!role) return null;
  if (!allowed.includes(role)) return null;
  return <>{children}</>;
}
