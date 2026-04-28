"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  FileText,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  scoreService,
  SCORE_KEYS,
  type ScoreDashboardPeriod,
} from "@/lib/score-service";
import { AdminScoreRequestsTable } from "@/components/admin/admin-score-requests-table";
import { StatCard } from "@/components/shared/stat-card";
import { NoPermission } from "@/components/shared/no-permission";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { formatNumber, formatPct } from "@/lib/utils";
import { PERMISSION_CODES } from "@/lib/constant";

const PERIOD_OPTIONS: {
  value: ScoreDashboardPeriod;
  label: string;
  short: string;
}[] = [
  { value: "today", label: "Today", short: "today" },
  { value: "7d", label: "Last 7 days", short: "last 7 days" },
  { value: "30d", label: "Last 30 days", short: "last 30 days" },
  { value: "90d", label: "Last 90 days", short: "last 90 days" },
];

export default function AdminScoreRequestsPage() {
  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.ADMIN.SCORE_REQUESTS_READ);

  const [period, setPeriod] = useState<ScoreDashboardPeriod>("30d");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);

  // Platform-wide stats (cross-org). per integration guide §5
  const statsQuery = useQuery({
    queryKey: SCORE_KEYS.platformStats(period),
    queryFn: () => scoreService.getPlatformScoreRequestsStats(period),
    refetchInterval: period === "today" ? 60_000 : 5 * 60_000,
    staleTime: period === "today" ? 30_000 : 2 * 60_000,
    refetchOnWindowFocus: false,
    enabled: canRead,
  });

  // Cross-org list — admins reading every org's score requests.
  const listQuery = useQuery({
    queryKey: SCORE_KEYS.list({
      page,
      perPage: 10,
      search: debouncedSearch,
    }),
    queryFn: () =>
      scoreService.getScoreRequests({
        page,
        perPage: 10,
        search: debouncedSearch,
      }),
    enabled: canRead,
  });

  const stats = statsQuery.data;
  const periodShort =
    PERIOD_OPTIONS.find((o) => o.value === period)?.short ?? period;
  const statsLoading = statsQuery.isLoading;

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            Platform-wide credit score activity across all organisations.
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

  const needsAttention = stats
    ? stats.needs_attention.referred +
      stats.needs_attention.pending_or_processing +
      stats.needs_attention.failed
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            Platform-wide credit score activity across all organisations.
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as ScoreDashboardPeriod)}
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Platform KPI tiles */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statsLoading || !stats ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label={`Requests · ${periodShort}`}
              value={formatNumber(stats.current.total_requests)}
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              description={
                stats.trend.total_delta_pct != null
                  ? `${stats.trend.total_delta_pct >= 0 ? "+" : ""}${stats.trend.total_delta_pct.toFixed(1)}% vs previous`
                  : `${formatNumber(stats.previous.total_requests)} previous`
              }
            />
            <StatCard
              label="Approval rate"
              value={
                stats.current.decided > 0
                  ? formatPct(stats.current.approval_rate_pct, 1)
                  : "—"
              }
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              description={
                stats.trend.approval_delta_pp != null
                  ? `${stats.trend.approval_delta_pp >= 0 ? "+" : ""}${stats.trend.approval_delta_pp.toFixed(1)}pp vs previous`
                  : stats.current.decided > 0
                    ? `across ${formatNumber(stats.current.decided)} decisions`
                    : "no decisions yet"
              }
              tone={stats.current.decided > 0 ? "success" : "default"}
            />
            <StatCard
              label="Average credit score"
              value={stats.current.avg_credit_score ?? "—"}
              icon={<FileText className="h-4 w-4 text-primary" />}
              description={
                stats.current.median_credit_score != null
                  ? `median ${stats.current.median_credit_score}`
                  : "no scored requests"
              }
            />
            <StatCard
              label="Needs attention"
              value={formatNumber(needsAttention)}
              icon={
                <ShieldCheck
                  className={`h-4 w-4 ${needsAttention > 0 ? "text-yellow-500" : "text-green-500"}`}
                />
              }
              description={`${stats.needs_attention.referred} referred · ${stats.needs_attention.pending_or_processing} in flight · ${stats.needs_attention.failed} failed`}
              tone={needsAttention > 0 ? "warning" : "success"}
            />
          </>
        )}
      </div>

      {/* The per-org "by organisation" breakdown was removed on 2026-04-27
          when the platform stats endpoint dropped its `by_org[]` field. The
          admin-side org list at /organizations is the canonical place for a
          paginated per-tenant view; bundling it into a stats response was
          duplicate surface area. Per-row score-request counts can be added
          there later via the fan-out pattern documented in the changelog. */}

      {/* Cross-org list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Score Requests</CardTitle>
              <CardDescription>
                Credit score evaluations submitted by registered organisations.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdminScoreRequestsTable
            data={listQuery.data}
            isLoading={listQuery.isLoading}
            isError={listQuery.isError}
            page={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16 mt-3" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}
