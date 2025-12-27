type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  requestId?: string;
  compact?: boolean;
  className?: string;
};

const variantStyles: Record<AlertVariant, string> = {
  info: "border-white/15 bg-white/5 text-white/80",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  error: "border-red-500/40 bg-red-500/10 text-red-100"
};

export function Alert({
  variant = "info",
  title,
  description,
  requestId,
  compact = false,
  className
}: AlertProps) {
  const classes = [
    "rounded-xl",
    "border",
    "px-4",
    compact ? "py-2" : "py-3",
    "text-sm",
    variantStyles[variant],
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {title && <p className="font-semibold text-white">{title}</p>}
      {description && <p className={title ? "mt-1 text-white/80" : "text-white/80"}>{description}</p>}
      {requestId && <p className="mt-2 text-xs text-white/40">Код запроса: {requestId}</p>}
    </div>
  );
}
