import { EmptyState } from "@/components/empty-state";

export default function ScoutWorkingPage() {
  return (
    <EmptyState
      title="Мои игроки"
      description="Пока нет игроков в работе. Примите запросы или отправьте новые."
      actionHref="/app/scout/requests"
      actionLabel="Перейти к запросам"
    />
  );
}
