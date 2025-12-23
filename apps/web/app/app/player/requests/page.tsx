import { EmptyState } from "@/components/empty-state";

export default function PlayerRequestsPage() {
  return (
    <EmptyState
      title="Входящие запросы"
      description="Запросов пока нет. Новые обращения от скаутов и клубов появятся здесь."
      actionHref="/app/player/profile"
      actionLabel="Перейти к профилю"
    />
  );
}
