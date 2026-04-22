"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Bell,
  BellOff,
  Brain,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { ROUTES } from "@/lib/constant";
import {
  formatDate,
  formatMetric,
  formatMs,
  formatNumber,
  formatPct,
  prettyModelType,
} from "@/lib/utils";
import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { StatCard } from "@/components/shared/stat-card";
import { MonitoringChart } from "@/components/admin/monitoring/monitoring-timeseries-chart";
import type {
  InfrastructurePeriod,
  ModelOpsPeriod,
  RiskPeriod,
} from "@/types/monitoring-types";

const ALERTS_POLL_MS = 60_000;
const INFRA_POLL_MS = 60_000;
const RISK_POLL_MS = 5 * 60_000;
const MODEL_OPS_POLL_MS = 10 * 60_000;

const INFRA_PERIOD_OPTIONS: { value: InfrastructurePeriod; label: string }[] = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const RISK_PERIOD_OPTIONS: { value: RiskPeriod; label: string }[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const MODEL_OPS_PERIOD_OPTIONS: { value: ModelOpsPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function periodLabel(value: string): string {
  switch (value) {
    case "1h":
      return "last hour";
    case "6h":
      return "last 6 hours";
    case "24h":
      return "last 24 hours";
    case "7d":
      return "last 7 days";
    case "30d":
      return "last 30 days";
    case "90d":
      return "last 90 days";
    default:
      return value;
  }
}

export default function AdminDashboardPage() {
  const [infraPeriod, setInfraPeriod] =
    useState<InfrastructurePeriod>("24h");
  const [riskPeriod, setRiskPeriod] = useState<RiskPeriod>("7d");
  const [modelOpsPeriod, setModelOpsPeriod] =
    useState<ModelOpsPeriod>("30d");

  const infraQuery = useQuery({
    queryKey: MONITORING_KEYS.infrastructure({ period: infraPeriod }),
    queryFn: () =>
      monitoringService.getInfrastructure({ period: infraPeriod }),
    refetchInterval: INFRA_POLL_MS,
    staleTime: INFRA_POLL_MS / 2,
  });

  const riskQuery = useQuery({
    queryKey: MONITORING_KEYS.risk({ period: riskPeriod }),
    queryFn: () => monitoringService.getRisk({ period: riskPeriod }),
    refetchInterval: RISK_POLL_MS,
    staleTime: RISK_POLL_MS / 2,
  });

  const modelOpsQuery = useQuery({
    queryKey: MONITORING_KEYS.modelOps({ period: modelOpsPeriod }),
    queryFn: () => monitoringService.getModelOps({ period: modelOpsPeriod }),
    refetchInterval: MODEL_OPS_POLL_MS,
    staleTime: MODEL_OPS_POLL_MS / 2,
  });

  const alertsQuery = useQuery({
    queryKey: MONITORING_KEYS.alerts({ status: "firing", limit: 5 }),
    queryFn: () =>
      monitoringService.getAlerts({ status: "firing", limit: 5 }),
    refetchInterval: ALERTS_POLL_MS,
    staleTime: ALERTS_POLL_MS / 2,
  });

  const infra = infraQuery.data;
  const risk = riskQuery.data;
  const modelOps = modelOpsQuery.data;
  const alerts = alertsQuery.data;

  const firingCount = alerts?.summary?.total_firing ?? 0;
  const criticalCount = alerts?.summary?.critical_firing ?? 0;
  const isHealthy = firingCount === 0;

  const totalRequests = infra?.request_volume?.total ?? 0;
  const p99 = infra?.latency?.p99_ms ?? 0;
  const errorRate = infra?.error_rates?.overall_pct ?? 0;

  const approveRate = risk?.approval_rates?.overall?.approve_rate_pct ?? 0;
  const totalDecisions = risk?.approval_rates?.overall?.total_decisions ?? 0;
  const declineRate = risk?.approval_rates?.overall?.decline_rate_pct ?? 0;

  const champions = modelOps?.champions ?? [];
  const champAlerting = champions.filter((c) => c.auc_alert).length;
  const topChampion =
    champions.find((c) => c.model_type === "credit_risk") ?? champions[0];
  const topAuc = topChampion?.live_auc ?? topChampion?.current_metrics?.auc;

  const infraLoading = infraQuery.isLoading;
  const riskLoading = riskQuery.isLoading;
  const modelOpsLoading = modelOpsQuery.isLoading;

  return (
    <div className="space-y-6">
      {/* 1. Hero header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground text-sm">
            A live look at platform health, lending decisions, and model
            performance.
          </p>
          {infra?.generated_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {formatDate(infra.generated_at)}
            </p>
          )}
        </div>
        <Link
          href={ROUTES.ADMIN.MONITORING}
          className="inline-flex items-center"
          aria-label={
            isHealthy ? "All systems healthy" : `${firingCount} active alerts`
          }
        >
          {isHealthy ? (
            <Badge
              variant="outline"
              className="px-3 py-1.5 text-sm gap-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900/50"
            >
              <BellOff className="h-3.5 w-3.5" />
              All systems healthy
            </Badge>
          ) : (
            <Badge variant="destructive" className="px-3 py-1.5 text-sm gap-2">
              <Bell className="h-3.5 w-3.5" />
              {firingCount} need{firingCount === 1 ? "s" : ""} attention
              {criticalCount > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">
                  {criticalCount} urgent
                </span>
              )}
            </Badge>
          )}
        </Link>
      </div>

      {/* 2. KPI row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {infraLoading ? (
          <KpiSkeleton />
        ) : (
          <StatCard
            label="Requests"
            value={formatNumber(totalRequests)}
            icon={<Activity className="h-4 w-4 text-primary" />}
            description={`${periodLabel(infraPeriod)} · ${formatPct(errorRate, 2)} errors`}
          />
        )}
        {riskLoading ? (
          <KpiSkeleton />
        ) : (
          <StatCard
            label="Approval rate"
            value={formatPct(approveRate, 1)}
            icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            description={`${periodLabel(riskPeriod)} · ${formatNumber(totalDecisions)} decisions · ${formatPct(declineRate, 1)} declined`}
            tone={approveRate > 0 ? "success" : "default"}
          />
        )}
        {infraLoading ? (
          <KpiSkeleton />
        ) : (
          <StatCard
            label="Response time · P99"
            value={formatMs(p99)}
            icon={<Zap className="h-4 w-4 text-orange-500" />}
            description={`${periodLabel(infraPeriod)} · slowest 1%`}
            tone={p99 >= 1000 ? "danger" : "default"}
          />
        )}
        {modelOpsLoading ? (
          <KpiSkeleton />
        ) : (
          <StatCard
            label="Model accuracy"
            value={topAuc != null ? formatMetric(topAuc, 3) : "—"}
            icon={<Brain className="h-4 w-4 text-primary" />}
            description={
              topChampion
                ? `${prettyModelType(topChampion.model_type)} · v${topChampion.version}`
                : "no active champion"
            }
            tone={
              champAlerting > 0
                ? "danger"
                : topAuc != null
                  ? "success"
                  : "default"
            }
          />
        )}
      </div>

      {/* 3. Traffic + decision mix */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {infraLoading ? (
            <ChartCardSkeleton />
          ) : (
            <MonitoringChart
              title="Traffic"
              description="Requests, errors, and slowest-1% response time over time"
              data={infra?.timeseries ?? []}
              xKey="bucket"
              height={260}
              headerAction={
                <Select
                  value={infraPeriod}
                  onValueChange={(v) =>
                    setInfraPeriod(v as InfrastructurePeriod)
                  }
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INFRA_PERIOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
              series={[
                {
                  key: "requests",
                  label: "Requests",
                  formatter: (n) => n.toLocaleString(),
                },
                {
                  key: "errors",
                  label: "Errors",
                  color: "#ef4444",
                  formatter: (n) => n.toLocaleString(),
                },
                {
                  key: "p99_ms",
                  label: "Slowest 1% (ms)",
                  color: "#f59e0b",
                  yAxisId: "right",
                  formatter: (n) => `${Math.round(n)}ms`,
                },
              ]}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base">Decisions</CardTitle>
                <CardDescription>
                  How {formatNumber(totalDecisions)} applications resolved
                </CardDescription>
              </div>
              <Select
                value={riskPeriod}
                onValueChange={(v) => setRiskPeriod(v as RiskPeriod)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RISK_PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {riskLoading ? (
              <DecisionMixSkeleton />
            ) : totalDecisions === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No decisions recorded in this window.
              </p>
            ) : (
              <DecisionMixBar
                approve={risk?.approval_rates?.overall?.approve ?? 0}
                conditional={
                  risk?.approval_rates?.overall?.conditional_approve ?? 0
                }
                decline={risk?.approval_rates?.overall?.decline ?? 0}
                refer={risk?.approval_rates?.overall?.refer ?? 0}
                error={risk?.approval_rates?.overall?.error ?? 0}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Champion model health strip */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-base">Champion models</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={modelOpsPeriod}
                onValueChange={(v) =>
                  setModelOpsPeriod(v as ModelOpsPeriod)
                }
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPS_PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" asChild>
                <Link href={ROUTES.ADMIN.MONITORING}>
                  Model ops
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {modelOpsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ModelCardSkeleton />
              <ModelCardSkeleton />
              <ModelCardSkeleton />
              <ModelCardSkeleton />
            </div>
          ) : champions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No active models yet. They&apos;ll appear once training
              completes.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {champions.slice(0, 4).map((c) => {
                const auc = c.live_auc ?? c.current_metrics?.auc;
                const change = c.auc_change_pct;
                const tone = c.auc_alert
                  ? "text-red-600"
                  : change != null && change > 0
                    ? "text-green-600"
                    : change != null && change < 0
                      ? "text-yellow-600"
                      : "text-muted-foreground";
                return (
                  <div
                    key={`${c.model_type}-${c.version}`}
                    className={`rounded-md border p-3 space-y-1.5 ${c.auc_alert ? "border-red-300 bg-red-50/40 dark:bg-red-900/10" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground truncate">
                        {prettyModelType(c.model_type)}
                      </p>
                      {c.auc_alert ? (
                        <Badge variant="destructive" className="text-[10px]">
                          ⚠ drop
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-green-50 text-green-700 border-green-200"
                        >
                          healthy
                        </Badge>
                      )}
                    </div>
                    <p className="text-xl font-semibold">
                      {formatMetric(auc, 3)}
                    </p>
                    <p className={`text-xs ${tone}`}>
                      {change != null
                        ? `${change > 0 ? "+" : ""}${change.toFixed(2)}% vs baseline`
                        : "no baseline yet"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionMixBar({
  approve,
  conditional,
  decline,
  refer,
  error,
}: {
  approve: number;
  conditional: number;
  decline: number;
  refer: number;
  error: number;
}) {
  const total = Math.max(1, approve + conditional + decline + refer + error);
  const rows = [
    { key: "approve", label: "Approved", count: approve, color: "bg-green-500" },
    {
      key: "conditional",
      label: "Conditional",
      count: conditional,
      color: "bg-lime-500",
    },
    { key: "refer", label: "Referred", count: refer, color: "bg-yellow-500" },
    { key: "decline", label: "Declined", count: decline, color: "bg-red-500" },
    {
      key: "error",
      label: "Could not score",
      count: error,
      color: "bg-muted-foreground/40",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        {rows.map((r) =>
          r.count > 0 ? (
            <div
              key={r.key}
              className={r.color}
              style={{ width: `${(r.count / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${r.color}`} />
              <span>{r.label}</span>
            </div>
            <span className="font-mono">
              {formatNumber(r.count)} · {formatPct((r.count / total) * 100, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-20 mt-3" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-9 w-44" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full" />
      </CardContent>
    </Card>
  );
}

function DecisionMixSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-2 w-full rounded-full" />
      <ul className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3 w-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModelCardSkeleton() {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

