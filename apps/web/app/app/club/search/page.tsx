import { EmptyState } from "@/components/empty-state";

export default function ClubSearchPage() {
  return (
    <EmptyState
      title="Поиск игроков"
      description="Подходящих игроков пока нет. Настройте фильтры и добавьте кандидатов."
      actionHref="/app/club/shortlists"
      actionLabel="Перейти к шортлистам"
    />
  );
}
