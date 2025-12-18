"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type AuditLog = {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown> | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<AuditLog[]>("/admin/audit", { auth: true });
      setLogs(data);
    } catch (err) {
      setError("Нужна авторизация администратора и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="container space-y-8 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="pill mb-2">Админ • Аудит</p>
          <h1 className="text-3xl font-bold">Журнал действий</h1>
          <p className="text-white/70">Последние 200 событий (создание/изменение/модерация).</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
        </div>
        <Link href="/admin" className="ghost-btn">
          Назад
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-white/60">
            <tr>
              <th className="p-2 text-left">Действие</th>
              <th className="p-2 text-left">Объект</th>
              <th className="p-2 text-left">ID пользователя</th>
              <th className="p-2 text-left">Дата</th>
              <th className="p-2 text-left">Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-white/5">
                <td className="p-2">{log.action}</td>
                <td className="p-2">{log.entityType} {log.entityId || ""}</td>
                <td className="p-2">{log.actorUserId || "-"}</td>
                <td className="p-2 text-white/60">{new Date(log.createdAt).toLocaleString("ru-RU")}</td>
                <td className="p-2 text-white/70 text-xs max-w-xs truncate">{log.payload ? JSON.stringify(log.payload) : ""}</td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr className="border-t border-white/5">
                <td className="p-2 text-white/70" colSpan={5}>Нет данных или нет доступа.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
