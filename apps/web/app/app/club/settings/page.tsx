import { EmptyState } from "@/components/empty-state";

export default function ClubSettingsPage() {
  return (
    <EmptyState
      title="Настройки клуба"
      description="Здесь появятся настройки команды, уведомлений и доступа."
      actionHref="/app/club/search"
      actionLabel="Перейти к поиску"
    />
  );
}
