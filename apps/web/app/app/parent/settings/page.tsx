import { EmptyState } from "@/components/empty-state";

export default function ParentSettingsPage() {
  return (
    <EmptyState
      title="Настройки аккаунта"
      description="Данных пока нет. Настройки профиля появятся здесь."
      actionHref="/app/parent/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
