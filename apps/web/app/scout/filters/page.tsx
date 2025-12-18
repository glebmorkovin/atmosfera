"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";

type SavedFilter = {
  id: string;
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
};

export default function ScoutFiltersPage() {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [config, setConfig] = useState("{\"position\":\"D\"}");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<SavedFilter[]>("/search-filters", { auth: true });
      setFilters(data);
    } catch (err) {
      setError("Нужен вход (скаут/админ) и запущенный API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(config);
      await apiFetch("/search-filters", { method: "POST", body: { name, config: parsed }, auth: true });
      setName("");
      setConfig("{}");
      load();
    } catch {
      setError("Не удалось сохранить фильтр (проверьте JSON и авторизацию)");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/search-filters/${id}`, { method: "DELETE", auth: true });
      load();
    } catch {
      setError("Не удалось удалить фильтр");
    }
  };

  return (
    <main className="min-h-screen bg-secondary">
      <div className="container space-y-8 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="pill mb-2">Скаут • Сохранённые фильтры</p>
            <h1 className="text-3xl font-bold">Мои фильтры поиска</h1>
            <p className="text-white/70">Сохраняйте конфигурации поиска для быстрых подборок.</p>
            {error && <p className="text-sm text-amber-300">{error}</p>}
            {loading && <p className="text-sm text-white/60">Загрузка...</p>}
          </div>
          <Link href="/scout" className="ghost-btn">
            Назад
          </Link>
        </div>

        <form className="card space-y-3" onSubmit={create}>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название фильтра"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            />
            <textarea
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder='Конфиг JSON (например, {"position":"D"})'
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm md:col-span-2"
              rows={2}
            />
          </div>
          <button className="primary-btn justify-center text-sm" type="submit">Сохранить фильтр</button>
        </form>

        <div className="grid gap-3 md:grid-cols-2">
          {filters.map((f) => (
            <div key={f.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{f.name}</h3>
                  <p className="text-xs text-white/60">{new Date(f.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <button className="ghost-btn px-3 py-2 text-xs" onClick={() => remove(f.id)}>
                  Удалить
                </button>
              </div>
              <pre className="rounded-lg bg-black/30 p-3 text-xs text-white/70 whitespace-pre-wrap">{JSON.stringify(f.config, null, 2)}</pre>
            </div>
          ))}
          {!loading && filters.length === 0 && <div className="card md:col-span-2 text-white/70">Нет сохранённых фильтров.</div>}
        </div>
      </div>
    </main>
  );
}
