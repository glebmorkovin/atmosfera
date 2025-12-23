import { EmptyState } from "@/components/empty-state";

export default function PlayerApplicationsPage() {
  return (
    <EmptyState
      title="Мои отклики"
      description="Откликов пока нет. Вы сможете откликаться на вакансии клубов."
      actionHref="/app/player/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
