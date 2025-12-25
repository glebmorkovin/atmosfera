"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type User = { id: string; email: string; role: string; isActive: boolean };
type PlayerMod = { id: string; firstName: string; lastName: string; moderationStatus: string; moderationComment?: string | null };
type MediaMod = { id: string; mediaType: string; status: string; urlOrPath: string; moderationComment?: string | null };
type League = { id: string; name: string; country?: string | null; level?: string | null };
type Vacancy = { id: string; title: string; status: string };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<PlayerMod[]>([]);
  const [media, setMedia] = useState<MediaMod[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [pendingVacancies, setPendingVacancies] = useState<Vacancy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, playersRes, mediaRes, leaguesRes] = await Promise.all([
        apiFetch<User[]>("/admin/users", { auth: true }).catch(() => []),
        apiFetch<PlayerMod[]>("/players/search?pageSize=20", { auth: true }).then((r: any) => r.data || []).catch(() => []),
        apiFetch<MediaMod[]>("/admin/media", { auth: true }).catch(() => []),
        apiFetch<League[]>("/admin/leagues", { auth: true }).catch(() => [])
      ]);
      const vacanciesRes = await apiFetch<Vacancy[]>("/admin/vacancies?status=PENDING_MODERATION", { auth: true }).catch(() => []);
      setUsers(usersRes);
      setPlayers(playersRes);
      setMedia(mediaRes);
      setLeagues(leaguesRes);
      setPendingVacancies(vacanciesRes);
    } catch (err) {
      setError("Нужна авторизация администратора и запущенный API.");
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
          <p className="pill mb-2">Админ-панель</p>
          <h1 className="text-3xl font-bold">Модерация и справочники</h1>
          <p className="text-white/70">Управление пользователями, профилями, медиа, лигами.</p>
          {error && <p className="text-sm text-amber-300">{error}</p>}
          {loading && <p className="text-sm text-white/60">Загрузка...</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Вакансии на модерации</h3>
            <span className="pill">{pendingVacancies.length}</span>
          </div>
          <div className="space-y-2 text-sm">
            {pendingVacancies.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{v.title}</p>
                  <p className="text-white/60">{v.status}</p>
                </div>
                <Link href={`/admin/vacancies/${v.id}`} className="ghost-btn px-3 py-2 text-xs">
                  Открыть
                </Link>
              </div>
            ))}
            {pendingVacancies.length === 0 && <p className="text-white/60">Нет вакансий на модерации.</p>}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Пользователи</h3>
            <span className="pill">{users.length}</span>
          </div>
          <div className="space-y-2 text-sm">
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{u.email}</p>
                  <p className="text-white/60">{u.role}</p>
                </div>
                <span className={`pill ${u.isActive ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                  {u.isActive ? "Активен" : "Блок"}
                </span>
              </div>
            ))}
            {users.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Профили игроков</h3>
            <span className="pill">{players.length}</span>
          </div>
          <div className="space-y-2 text-sm">
            {players.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{p.firstName} {p.lastName}</p>
                  <p className="text-white/60">{(p as any).position || "-"}</p>
                </div>
                <span className="pill">{(p as any).moderationStatus || "-"}</span>
              </div>
            ))}
            {players.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Медиа на модерации</h3>
            <span className="pill">{media.length}</span>
          </div>
          <div className="space-y-2 text-sm">
            {media.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{m.mediaType}</p>
                  <p className="text-white/60 truncate max-w-xs">{m.urlOrPath}</p>
                </div>
                <span className="pill">{m.status}</span>
              </div>
            ))}
            {media.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Лиги</h3>
            <span className="pill">{leagues.length}</span>
          </div>
          <div className="space-y-2 text-sm">
            {leagues.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-white/60">{l.country} {l.level}</p>
                </div>
              </div>
            ))}
            {leagues.length === 0 && <p className="text-white/60">Нет данных или нет доступа.</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold">Аудит (последние события)</h3>
          <Link href="/admin/audit" className="ghost-btn px-4 py-2 text-xs">Открыть журнал</Link>
        </div>
        <p className="text-sm text-white/70">Здесь отображаются действия модерации, включая вакансии.</p>
      </div>
    </main>
  );
}
