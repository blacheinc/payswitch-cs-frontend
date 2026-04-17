"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Target,
  Percent,
  ShieldAlert,
} from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { formatPercent } from "@/lib/monitoring-display";
import { MonitoringTimeseriesChart } from "@/components/admin/monitoring/monitoring-timeseries-chart";

/** GET /v1/monitoring/risk — period: 24h | 7d | 30d | 90d (default 7d) */
const PERIOD_OPTIONS = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

/** segment: score grade A–F per OpenAPI */
const GRADE_OPTIONS = [
  { value: "all", label: "All Grades" },
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

export function RiskTab() {
  const [period, setPeriod] = useState("7d");
  const [segment, setSegment] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: MONITORING_KEYS.risk({
      period,
      segment: segment === "all" ? undefined : segment,
    }),
    queryFn: () =>
      monitoringService.getRisk({
        period,
        segment: segment === "all" ? undefined : segment,
      }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          Failed to load risk dashboard data.
        </p>
      </div>
    );
  }

  const summary = data?.summary ?? {};
  const distribution = Array.isArray(data?.score_distribution)
    ? data.score_distribution
    : [];
  const approvalTs = data?.approval_rate_timeseries ?? [];
  const delinqTs = data?.delinquency_timeseries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-36 sm:w-40">
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
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scored</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_scored != null
                ? summary.total_scored.toLocaleString()
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approval Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(summary.approval_rate ?? null, 1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Credit Score
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.avg_credit_score != null
                ? Math.round(summary.avg_credit_score)
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Rate</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(summary.default_rate ?? null, 2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average PD</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(summary.avg_pd ?? null, 2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonitoringTimeseriesChart
          title="Approval rate"
          description="Trend from GET /v1/monitoring/risk"
          data={approvalTs}
          valueFormatter={(n) => formatPercent(n, 1)}
        />
        <MonitoringTimeseriesChart
          title="Delinquency"
          description="Trend from GET /v1/monitoring/risk"
          data={delinqTs}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score grade distribution</CardTitle>
          <CardDescription>
            Breakdown of scored applicants by credit grade (segment filter applies
            to the whole dashboard per API)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {distribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No distribution buckets returned for this period or segment.
            </p>
          ) : (
            <div className="space-y-4">
              {distribution.map((bucket) => (
                <div key={bucket.grade} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${GRADE_COLORS[bucket.grade] ?? "bg-muted"}`}
                      />
                      <span className="font-medium">Grade {bucket.grade}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {bucket.count?.toLocaleString() ?? "—"}
                      </span>
                      <span className="font-semibold w-16 text-right">
                        {bucket.percentage != null
                          ? `${bucket.percentage.toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <Progress value={bucket.percentage ?? 0} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {distribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribution table</CardTitle>
            <CardDescription>Same data as bars, sortable view</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribution.map((b) => (
                  <TableRow key={b.grade}>
                    <TableCell className="font-medium">{b.grade}</TableCell>
                    <TableCell className="text-right">
                      {b.count?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {b.percentage != null ? `${b.percentage.toFixed(1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
