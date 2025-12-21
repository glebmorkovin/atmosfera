import { EmptyState } from "@/components/empty-state";

export default function ParentRequestsPage() {
  return (
    <EmptyState
      title="Входящие запросы"
      description="Запросов пока нет. Новые обращения от скаутов и клубов появятся здесь."
      actionHref="/app/parent/children"
      actionLabel="Перейти к профилям детей"
    />
  );
}
