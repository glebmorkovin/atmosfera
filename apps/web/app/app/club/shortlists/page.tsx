import { EmptyState } from "@/components/empty-state";

export default function ClubShortlistsPage() {
  return (
    <EmptyState
      title="Шортлисты"
      description="Пока нет списков сравнения. Добавьте игроков через поиск."
      actionHref="/app/club/search"
      actionLabel="Перейти к поиску"
    />
  );
}
