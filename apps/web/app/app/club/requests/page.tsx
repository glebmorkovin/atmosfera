import { EmptyState } from "@/components/empty-state";

export default function ClubRequestsPage() {
  return (
    <EmptyState
      title="Запросы к игрокам"
      description="Пока нет отправленных запросов. Инициируйте контакт с подходящими игроками."
      actionHref="/app/club/search"
      actionLabel="Перейти к поиску"
    />
  );
}
