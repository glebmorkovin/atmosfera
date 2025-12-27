import { EmptyState } from "@/components/empty-state";

export default function ParentDashboardPage() {
  return (
    <EmptyState
      title="Дашборд родителя"
      description="Здесь будут все профили детей, запросы и отклики. Начните с добавления ребёнка."
      actionHref="/app/parent/children"
      actionLabel="Перейти к профилям детей"
    />
  );
}
