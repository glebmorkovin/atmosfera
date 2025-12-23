import { EmptyState } from "@/components/empty-state";

export default function ClubVacanciesPage() {
  return (
    <EmptyState
      title="Вакансии клуба"
      description="Вакансий пока нет. Создайте первую публикацию для просмотра игроков."
      actionHref="/app/club/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
