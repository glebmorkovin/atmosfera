import { EmptyState } from "@/components/empty-state";

export default function ClubDashboardPage() {
  return (
    <EmptyState
      title="Дашборд клуба"
      description="Данных пока нет. Управляйте вакансиями и кандидатами из этого раздела."
      actionHref="/app/club/vacancies"
      actionLabel="Перейти к вакансиям"
    />
  );
}
