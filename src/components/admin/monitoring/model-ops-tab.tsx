"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  RefreshCcw,
  Trophy,
  XCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui/table";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { formatDate, formatMetric, prettyModelType } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertInlineList } from "@/components/admin/monitoring/alert-inline";
import {
  MonitoringAlertBannerSkeleton,
  MonitoringBreakdownCardSkeleton,
  MonitoringFilterBarSkeleton,
  MonitoringKpiSkeleton,
} from "@/components/admin/monitoring/monitoring-skeletons";
import type { ModelOpsPeriod } from "@/types/monitoring-types";

const PERIOD_OPTIONS: { value: ModelOpsPeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const MODEL_TYPE_OPTIONS = [
  { value: "all", label: "All models" },
  { value: "credit_risk", label: "Credit risk" },
  { value: "fraud_detection", label: "Fraud detection" },
  { value: "loan_amount", label: "Loan amount" },
  { value: "income_verification", label: "Income verification" },
];

const POLL_MS = 10 * 60_000;

function driftTone(psi: number): "success" | "warning" | "danger" {
  if (psi >= 0.25) return "danger";
  if (psi >= 0.1) return "warning";
  return "success";
}

export function ModelOpsTab() {
  const [period, setPeriod] = useState<ModelOpsPeriod>("30d");
  const [modelType, setModelType] = useState<string>("all");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: MONITORING_KEYS.modelOps({
      period,
      model_type: modelType === "all" ? undefined : modelType,
    }),
    queryFn: () =>
      monitoringService.getModelOps({
        period,
        model_type: modelType === "all" ? undefined : modelType,
      }),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS / 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <MonitoringFilterBarSkeleton selects={2} />
        <MonitoringAlertBannerSkeleton />
        {/* Champion cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <ChampionCardSkeleton key={i} />
          ))}
        </div>
        {/* Score stability — heading + caption + 4 KPI tiles */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-72" />
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <MonitoringKpiSkeleton key={i} />
            ))}
          </div>
        </div>
        {/* Feature drift + Retraining history — 2-col grid */}
        <div className="grid gap-4 xl:grid-cols-2">
          <MonitoringBreakdownCardSkeleton rows={5} />
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-56" />
            </CardHeader>
            <CardContent>
              <TableSkeleton
                bordered={false}
                headers={["Run", "Model", "Result", "Accuracy change", "When"]}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">
          Failed to load ModelOps data.
        </p>
      </div>
    );
  }

  const champions = data.champions ?? [];
  const drift = data.feature_drift ?? [];
  const distPsi = data.score_distribution_psi ?? [];
  const history = data.retraining_history ?? [];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Select value={modelType} onValueChange={setModelType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODEL_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as ModelOpsPeriod)}
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

      <AlertInlineList alerts={data.alerts} title="Model performance alerts" />

      {/* Champion cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {champions.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="py-10 text-center">
              <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                No active models yet. They&apos;ll appear here after the first
                training run completes.
              </p>
            </CardContent>
          </Card>
        ) : (
          champions.map((c) => {
            const auc = c.live_auc ?? c.current_metrics?.auc;
            const change = c.auc_change_pct;
            const changeTone =
              change == null
                ? "text-muted-foreground"
                : change < -2
                  ? "text-red-600"
                  : change < 0
                    ? "text-yellow-600"
                    : "text-green-600";
            return (
              <Card
                key={`${c.model_type}-${c.version}`}
                className={c.auc_alert ? "border-red-300" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        {prettyModelType(c.model_type)}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {c.registry_name} · v{c.version}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        c.auc_alert
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-green-50 text-green-700 border-green-200"
                      }
                    >
                      {c.auc_alert ? "Accuracy dropped" : "Healthy"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Accuracy (AUC)
                      </p>
                      <p className="text-xl font-semibold">
                        {formatMetric(auc, 3)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Accuracy change
                      </p>
                      <p className={`text-xl font-semibold ${changeTone}`}>
                        {change != null
                          ? `${change > 0 ? "+" : ""}${change.toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deployed</p>
                      <p className="text-xs mt-1.5">
                        {formatDate(c.created_at)}
                      </p>
                    </div>
                  </div>
                  {c.current_metrics && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {Object.entries(c.current_metrics)
                        .filter(([k]) => k !== "auc")
                        .map(([k, v]) => (
                          <Badge
                            key={k}
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {k}: {formatMetric(v, 3)}
                          </Badge>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Distribution PSI cards */}
      {distPsi.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Score stability
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            How much the score pattern has shifted vs the training data. Higher
            means more shift — alerts fire above 0.20.
          </p>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {distPsi.map((d) => (
              <StatCard
                key={d.model_type}
                label={prettyModelType(d.model_type)}
                value={formatMetric(d.psi, 3)}
                description="alerts above 0.20"
                tone={
                  String(d.status).toLowerCase() === "alert"
                    ? "danger"
                    : "success"
                }
                icon={
                  String(d.status).toLowerCase() === "alert" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Feature drift */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Input data shift</CardTitle>
            </div>
            <CardDescription>
              How much each input has drifted from the data the model was
              trained on · warning above 0.25
            </CardDescription>
          </CardHeader>
          <CardContent>
            {drift.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No shift data available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {drift.map((d) => {
                  const tone = driftTone(d.psi);
                  const barTone =
                    tone === "danger"
                      ? "bg-red-500"
                      : tone === "warning"
                        ? "bg-yellow-500"
                        : "bg-green-500";
                  return (
                    <div key={d.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate pr-2">
                          {prettyModelType(d.feature)}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs">
                            {formatMetric(d.psi, 3)}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              tone === "danger"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : tone === "warning"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                            }
                          >
                            {tone}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barTone}`}
                          style={{
                            width: `${Math.min((d.psi / 0.5) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retraining history */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Retraining history</CardTitle>
            </div>
            <CardDescription>Recent model updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Run</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead className="text-right">Accuracy change</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableEmpty
                      colSpan={5}
                      title="No model updates"
                      description="No retraining happened in this period."
                    />
                  ) : (
                    history.map((ev) => {
                      const before = ev.metrics_before?.auc;
                      const after = ev.metrics_after?.auc;
                      const delta =
                        before != null && after != null
                          ? after - before
                          : null;
                      return (
                        <TableRow key={ev.training_id}>
                          <TableCell className="font-mono text-xs truncate max-w-[120px]">
                            {ev.training_id}
                          </TableCell>
                          <TableCell className="text-sm">
                            {prettyModelType(ev.model_type)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ev.result === "success"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {ev.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {delta != null
                              ? `${delta > 0 ? "+" : ""}${delta.toFixed(3)}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(ev.completed_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Skeleton placeholder for a single champion-model card. */
function ChampionCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-14" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 rounded-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
