import { EmptyState } from "@/components/empty-state";

export default function ClubWorkingPage() {
  return (
    <EmptyState
      title="Кандидаты в работе"
      description="Пока нет активных кандидатов. Примите запросы или отправьте новые."
      actionHref="/app/club/requests"
      actionLabel="Перейти к запросам"
    />
  );
}
