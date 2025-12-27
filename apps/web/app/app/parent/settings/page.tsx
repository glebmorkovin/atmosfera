import { EmptyState } from "@/components/empty-state";

export default function ParentSettingsPage() {
  return (
    <EmptyState
      title="Настройки аккаунта"
      description="Управление профилем и уведомлениями появится здесь."
      actionHref="/app/parent/children"
      actionLabel="Перейти к детям"
    />
  );
}
