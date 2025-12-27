import { EmptyState } from "@/components/empty-state";

export default function ScoutSettingsPage() {
  return (
    <EmptyState
      title="Настройки"
      description="Настройки профиля и уведомлений появятся здесь."
      actionHref="/app/scout/search"
      actionLabel="Перейти к поиску"
    />
  );
}
