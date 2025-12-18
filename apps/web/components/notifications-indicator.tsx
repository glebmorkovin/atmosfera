"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

export function NotificationsIndicator() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const load = async () => {
      try {
        const items = await apiFetch<any[]>("/notifications", { auth: true });
        const unread = (items || []).filter((n) => !n.isRead).length;
        setCount(unread);
      } catch {
        setCount(0);
      }
      timer = setTimeout(load, 30000);
    };
    load();
    return () => clearTimeout(timer);
  }, []);

  if (count <= 0) return null;
  return <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-secondary">{count}</span>;
}
