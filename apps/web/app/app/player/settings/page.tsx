import { EmptyState } from "@/components/empty-state";

export default function PlayerSettingsPage() {
  return (
    <EmptyState
      title="Настройки аккаунта"
      description="Данных пока нет. Настройки профиля и безопасности появятся здесь."
      actionHref="/app/player/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
