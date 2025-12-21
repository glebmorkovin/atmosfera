import { EmptyState } from "@/components/empty-state";

export default function ScoutRequestsPage() {
  return (
    <EmptyState
      title="Исходящие запросы"
      description="Запросов пока нет. Отправьте первый запрос на сотрудничество."
      actionHref="/app/scout/search"
      actionLabel="Перейти к поиску"
    />
  );
}
