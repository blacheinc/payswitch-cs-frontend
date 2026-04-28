"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Building blocks for monitoring-tab loading states. Each tab composes
// these to match its own layout.
// =============================================================================

/** Placeholder for `<StatCard>` — small label, large value, caption. */
export function MonitoringKpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

/** Card with a title + caption header and a tall body block (for charts /
 *  large breakdowns). `bodyHeight` defaults to chart height (~260px). */
export function MonitoringChartCardSkeleton({
  bodyHeight = "h-64",
}: {
  bodyHeight?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${bodyHeight}`} />
      </CardContent>
    </Card>
  );
}

/** Card with header + N body rows — for outcome/grade/risk-level breakdowns
 *  that render a list of text + value pairs. */
export function MonitoringBreakdownCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Compact filter bar — N select placeholders + refresh button, with an
 * optional flex-1 input for tabs that include a search field.
 */
export function MonitoringFilterBarSkeleton({
  selects = 1,
  showInput = false,
}: {
  selects?: number;
  showInput?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {showInput && <Skeleton className="h-9 flex-1 min-w-[200px]" />}
      {Array.from({ length: selects }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-44" />
      ))}
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>
  );
}

/**
 * Single-line bordered placeholder shaped like the compact, no-firing-alerts
 * state of `<AlertInlineList>` — the common case during initial load.
 */
export function MonitoringAlertBannerSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <Skeleton className="h-3.5 w-3.5 rounded-full" />
      <Skeleton className="h-3 w-56" />
    </div>
  );
}
