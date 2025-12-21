import { EmptyState } from "@/components/empty-state";

export default function ParentChildrenPage() {
  return (
    <EmptyState
      title="Профили детей"
      description="Пока нет привязанных профилей. Добавьте ребёнка, чтобы управлять его данными."
      actionHref="/app/parent/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
