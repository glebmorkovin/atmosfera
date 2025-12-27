import { EmptyState } from "@/components/empty-state";

export default function PlayerSettingsPage() {
  return (
    <EmptyState
      title="Настройки аккаунта"
      description="Здесь появятся настройки профиля, безопасности и уведомлений."
      actionHref="/app/player/profile"
      actionLabel="Перейти к профилю"
    />
  );
}
