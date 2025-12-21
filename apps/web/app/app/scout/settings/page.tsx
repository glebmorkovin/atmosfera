import { EmptyState } from "@/components/empty-state";

export default function ScoutSettingsPage() {
  return (
    <EmptyState
      title="Настройки"
      description="Данных пока нет. Настройки профиля и уведомлений появятся здесь."
      actionHref="/app/scout/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
