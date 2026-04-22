import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /**
   * Compact mode — a single muted row, used when the empty state lives inside a
   * narrow container (e.g. a sidebar card) where a full icon + title + description
   * block would feel oversized.
   */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground py-1",
          className,
        )}
      >
        {icon && (
          <span className="text-muted-foreground/40 shrink-0 [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
        <span>{title}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-8 gap-2",
        className,
      )}
    >
      {icon && <div className="text-muted-foreground/40">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
