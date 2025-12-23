import { EmptyState } from "@/components/empty-state";

export default function ParentDashboardPage() {
  return (
    <EmptyState
      title="Дашборд родителя"
      description="Данных пока нет. Управляйте профилями детей и следите за запросами."
      actionHref="/app/parent/children"
      actionLabel="Перейти к профилям детей"
    />
  );
}
