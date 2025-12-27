import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function EmptyState({ title, description, actionHref, actionLabel, secondaryHref, secondaryLabel }: EmptyStateProps) {
  return (
    <main className="container space-y-4 py-12">
      <div className="card space-y-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-white/70">{description || "Данных пока нет."}</p>
        <div className="flex flex-wrap gap-3">
          {actionHref && actionLabel ? (
            <Link className="primary-btn w-fit" href={actionHref}>
              {actionLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link className="ghost-btn w-fit" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
