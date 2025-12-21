import { EmptyState } from "@/components/empty-state";

export default function ParentApplicationsPage() {
  return (
    <EmptyState
      title="Отклики детей"
      description="Откликов пока нет. После подачи заявок они появятся в этом списке."
      actionHref="/app/parent/children"
      actionLabel="Перейти к профилям детей"
    />
  );
}
