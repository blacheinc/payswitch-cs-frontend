import { AlertTriangle, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AlertItem } from "@/types/monitoring-types";

interface AlertInlineListProps {
  alerts: AlertItem[] | undefined;
  title?: string;
  /** When true, show an "All clear" panel instead of hiding the section. */
  emptyVisible?: boolean;
}

/** Compact inline alerts list for the tab-level alerts array. */
export function AlertInlineList({
  alerts,
  title = "Alerts",
  emptyVisible = true,
}: AlertInlineListProps) {
  const list = alerts ?? [];
  const firing = list.filter(
    (a) => String(a.status).toLowerCase() === "firing",
  );

  if (list.length === 0) {
    if (!emptyVisible) return null;
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        <span>{title}: no alerts configured.</span>
      </div>
    );
  }

  if (firing.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/10 px-3 py-2 text-xs">
        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
        <span className="text-green-700 dark:text-green-300">
          {title}: everything within normal limits.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10 px-3 py-2">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
        <span className="text-xs font-medium text-red-700 dark:text-red-300">
          {firing.length} need{firing.length === 1 ? "s" : ""} attention
        </span>
      </div>
      <ul className="space-y-1 text-xs">
        {firing.map((a, idx) => (
          <li
            key={`${a.metric}-${idx}`}
            className="flex items-center justify-between gap-2"
          >
            <span className="font-medium">
              {a.metric.replace(/_/g, " ")}
              {a.feature ? ` · ${a.feature}` : ""}
            </span>
            <Badge
              variant="outline"
              className="bg-white/60 dark:bg-background/60 font-mono"
            >
              {a.current_value} / {a.threshold}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
