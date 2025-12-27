type LoadingStateProps = {
  title?: string;
  subtitle?: string;
  lines?: number;
};

export function LoadingState({ title = "Загрузка...", subtitle, lines = 3 }: LoadingStateProps) {
  return (
    <div className="card space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-white/70">{title}</p>
        {subtitle && <p className="text-xs text-white/50">{subtitle}</p>}
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-3 w-full animate-pulse rounded-full bg-white/10" />
        ))}
      </div>
    </div>
  );
}
