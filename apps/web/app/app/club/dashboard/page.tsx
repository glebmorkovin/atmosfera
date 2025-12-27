import { EmptyState } from "@/components/empty-state";

export default function ClubDashboardPage() {
  return (
    <EmptyState
      title="Дашборд клуба"
      description="Контроль вакансий, откликов и кандидатов начинается здесь."
      actionHref="/app/club/vacancies"
      actionLabel="Перейти к вакансиям"
    />
  );
}
