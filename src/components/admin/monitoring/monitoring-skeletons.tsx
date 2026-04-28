"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// =============================================================================
// Building blocks for monitoring-tab loading states.
//
// Each tab (infrastructure / risk / model-ops / compliance) composes these
// to match its own loaded shape. The goal is consistency across tabs without
// forcing every tab into one rigid layout.
// =============================================================================

/** Replica of `<StatCard>` — small label, large value, caption. */
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
 * Compact filter bar — N select skeletons + refresh icon button. Matches the
 * loaded filter bars across monitoring tabs which are plain flex rows
 * (no Card wrapper).
 *
 * `selects` = number of select dropdowns (most tabs have 1, some have 2 or 3).
 * `showInput` = also render a flex-1 input placeholder (Infrastructure tab).
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
 * Replica of `<AlertInlineList>` in its compact "no alerts firing" state —
 * a single-line bordered notice. Not the firing-alerts card layout, which
 * is taller; we mimic the common case to avoid over-shaping the loader.
 */
export function MonitoringAlertBannerSkeleton() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <Skeleton className="h-3.5 w-3.5 rounded-full" />
      <Skeleton className="h-3 w-56" />
    </div>
  );
}
