"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { formatNumber, formatPct } from "@/lib/utils";
import { MonitoringChart } from "@/components/admin/monitoring/monitoring-timeseries-chart";
import { StatCard } from "@/components/shared/stat-card";
import { AlertInlineList } from "@/components/admin/monitoring/alert-inline";
import type { RiskPeriod, ScoreGrade } from "@/types/monitoring-types";

const PERIOD_OPTIONS: { value: RiskPeriod; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const GRADE_OPTIONS: { value: "all" | ScoreGrade; label: string }[] = [
  { value: "all", label: "All grades" },
  { value: "A", label: "Grade A" },
  { value: "B", label: "Grade B" },
  { value: "C", label: "Grade C" },
  { value: "D", label: "Grade D" },
  { value: "E", label: "Grade E" },
  { value: "F", label: "Grade F" },
];

const GRADE_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-lime-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  E: "bg-red-400",
  F: "bg-red-600",
};

const TIER_TONE: Record<string, string> = {
  LOW: "bg-green-50 text-green-700 border-green-200",
  MEDIUM: "bg-yellow-50 text-yellow-700 border-yellow-200",
  HIGH: "bg-red-50 text-red-700 border-red-200",
};

const POLL_MS = 5 * 60_000;

export function RiskTab() {
  const [period, setPeriod] = useState<RiskPeriod>("7d");
  const [segment, setSegment] = useState<"all" | ScoreGrade>("all");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: MONITORING_KEYS.risk({
      period,
      segment: segment === "all" ? undefined : segment,
    }),
    queryFn: () =>
      monitoringService.getRisk({
        period,
        segment: segment === "all" ? undefined : segment,
      }),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS / 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          Failed to load risk dashboard data.
        </p>
      </div>
    );
  }

  const overall = data.approval_rates?.overall;
  const byGrade = data.approval_rates?.by_grade ?? [];
  const distribution = data.score_distribution;
  const buckets = distribution?.buckets ?? [];
  const tiers = data.risk_tier_breakdown ?? [];
  const timeseries = data.timeseries ?? [];

  const maxBucketCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Select
          value={segment}
          onValueChange={(v) => setSegment(v as "all" | ScoreGrade)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as RiskPeriod)}
        >
          <SelectTrigger className="w-full sm:w-44">
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
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      <AlertInlineList alerts={data.alerts} title="Lending risk alerts" />

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Applications scored"
          value={formatNumber(overall?.total_decisions ?? 0)}
          icon={<BarChart3 className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Approval rate"
          value={formatPct(overall?.approve_rate_pct, 1)}
          icon={<TrendingUp className="h-4 w-4 text-green-500" />}
          tone="success"
        />
        <StatCard
          label="Conditional approvals"
          value={formatPct(overall?.conditional_approve_rate_pct, 1)}
          icon={<ShieldCheck className="h-4 w-4 text-lime-500" />}
        />
        <StatCard
          label="Decline rate"
          value={formatPct(overall?.decline_rate_pct, 1)}
          icon={<TrendingDown className="h-4 w-4 text-red-500" />}
          tone="danger"
        />
        <StatCard
          label="Average score"
          value={
            distribution?.mean != null
              ? Math.round(distribution.mean).toString()
              : "—"
          }
          icon={<Target className="h-4 w-4 text-primary" />}
          description={
            distribution?.median != null
              ? `middle score ${Math.round(distribution.median)}`
              : undefined
          }
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Outcome breakdown */}
      {overall && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outcome breakdown</CardTitle>
            <CardDescription>
              How the {formatNumber(overall.total_decisions)} scored
              applications were decided in this window
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            <DecisionCount
              label="Approved"
              value={overall.approve}
              tone="success"
            />
            <DecisionCount
              label="Approved with conditions"
              value={overall.conditional_approve}
              tone="default"
            />
            <DecisionCount
              label="Declined"
              value={overall.decline}
              tone="danger"
            />
            <DecisionCount
              label="Referred"
              value={overall.refer}
              tone="warning"
            />
            <DecisionCount
              label="Could not score"
              value={overall.error}
              tone="default"
              muted
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Approval rate by grade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Approvals by credit grade</CardTitle>
            <CardDescription>
              Share approved (green) vs declined (red) at each grade, A (best)
              through F (worst)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {byGrade.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No grade breakdown for this window.
              </p>
            ) : (
              <div className="space-y-3">
                {byGrade.map((row) => (
                  <div key={row.grade} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            GRADE_COLORS[row.grade] ?? "bg-muted"
                          }`}
                        />
                        <span className="font-medium">Grade {row.grade}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatNumber(row.total)})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600">
                          {formatPct(row.approve_rate_pct, 1)}
                        </span>
                        <span className="text-red-600">
                          {formatPct(row.decline_rate_pct, 1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                      <div
                        className="bg-green-500"
                        style={{ width: `${row.approve_rate_pct}%` }}
                      />
                      <div
                        className="bg-red-500"
                        style={{ width: `${row.decline_rate_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk tier breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk level</CardTitle>
            <CardDescription>
              How applicants split across low, medium, and high risk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tiers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No risk-tier data for this window.
              </p>
            ) : (
              <div className="space-y-3">
                {tiers.map((t) => (
                  <div key={t.tier} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <Badge
                        variant="outline"
                        className={TIER_TONE[t.tier] ?? ""}
                      >
                        {t.tier}
                      </Badge>
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatNumber(t.count)} · {formatPct(t.pct, 1)}
                      </span>
                    </div>
                    <Progress value={t.pct} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score distribution histogram */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Credit score spread</CardTitle>
          <CardDescription>
            {distribution?.std_dev != null
              ? `Applicants grouped by score · spread ±${distribution.std_dev.toFixed(0)} points`
              : "Applicants grouped by predicted credit score"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {buckets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No distribution buckets returned.
            </p>
          ) : (
            <div className="flex items-end gap-2 sm:gap-3 h-40">
              {buckets.map((b) => {
                const pct = (b.count / maxBucketCount) * 100;
                return (
                  <div
                    key={b.range}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0"
                  >
                    <div
                      className="w-full bg-primary/80 rounded-t"
                      style={{ height: `${pct}%`, minHeight: b.count > 0 ? 4 : 0 }}
                      title={`${b.range}: ${b.count}`}
                    />
                    <span className="text-[10px] text-muted-foreground font-mono truncate w-full text-center">
                      {b.range}
                    </span>
                    <span className="text-[10px] font-semibold">
                      {formatNumber(b.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <MonitoringChart
        title="Approvals over time"
        description="Approval rate, decline rate, and average credit score by time slice"
        data={timeseries}
        xKey="bucket"
        series={[
          {
            key: "approve_rate_pct",
            label: "Approval rate",
            color: "#10b981",
            formatter: (n) => `${n.toFixed(1)}%`,
          },
          {
            key: "decline_rate_pct",
            label: "Decline rate",
            color: "#ef4444",
            formatter: (n) => `${n.toFixed(1)}%`,
          },
          {
            key: "mean_credit_score",
            label: "Average score",
            color: "hsl(var(--primary))",
            yAxisId: "right",
            formatter: (n) => Math.round(n).toString(),
          },
        ]}
      />
    </div>
  );
}

function DecisionCount({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger" | "default";
  muted?: boolean;
}) {
  const toneClass =
    tone === "success"
      ? "text-green-600"
      : tone === "danger"
        ? "text-red-600"
        : tone === "warning"
          ? "text-yellow-600"
          : "";
  return (
    <div
      className={`rounded-md border p-3 ${muted ? "opacity-70" : ""} min-w-0`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold mt-1 ${toneClass}`}>
        {formatNumber(value)}
      </p>
    </div>
  );
}
