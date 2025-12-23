import { EmptyState } from "@/components/empty-state";

export default function ClubSettingsPage() {
  return (
    <EmptyState
      title="Настройки клуба"
      description="Данных пока нет. Настройки организации появятся здесь."
      actionHref="/app/club/dashboard"
      actionLabel="Вернуться к дашборду"
    />
  );
}
