"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  RefreshCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { formatDate, prettyModelType } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MonitoringFilterBarSkeleton,
  MonitoringKpiSkeleton,
} from "@/components/admin/monitoring/monitoring-skeletons";
import type {
  AlertDashboard,
  AlertDetail,
  AlertSeverity,
  AlertStatus,
} from "@/types/monitoring-types";

const STATUS_OPTIONS: { value: "all" | AlertStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "firing", label: "Firing" },
  { value: "resolved", label: "Resolved" },
  { value: "ok", label: "OK" },
];

const SEVERITY_OPTIONS: { value: "all" | AlertSeverity; label: string }[] = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
];

const LIMIT_OPTIONS = ["25", "50", "100", "200"];

const DASHBOARD_LABEL: Record<string, string> = {
  infrastructure: "Infrastructure",
  risk: "Risk",
  model_ops: "Model Ops",
  compliance: "Compliance",
};

const POLL_MS = 60_000;

function severityClass(s: string) {
  const key = s.toLowerCase();
  if (key === "critical")
    return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50";
  if (key === "warning")
    return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-900/50";
  return "bg-muted text-muted-foreground";
}

function borderClass(status: string, severity: string) {
  const s = status.toLowerCase();
  const sev = severity.toLowerCase();
  if (s !== "firing") return "border-l-green-500";
  return sev === "critical" ? "border-l-red-500" : "border-l-yellow-500";
}

export function AlertsTab() {
  const [statusFilter, setStatusFilter] = useState<"all" | AlertStatus>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | AlertSeverity>(
    "all",
  );
  const [limit, setLimit] = useState("50");
  const [dashboardFilter, setDashboardFilter] = useState<"all" | AlertDashboard>(
    "all",
  );

  const limitNum = Number.parseInt(limit, 10) || 50;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: MONITORING_KEYS.alerts({
      status: statusFilter === "all" ? undefined : statusFilter,
      severity: severityFilter === "all" ? undefined : severityFilter,
      limit: limitNum,
    }),
    queryFn: () =>
      monitoringService.getAlerts({
        status: statusFilter === "all" ? undefined : statusFilter,
        severity: severityFilter === "all" ? undefined : severityFilter,
        limit: limitNum,
      }),
    refetchInterval: POLL_MS,
    staleTime: POLL_MS / 2,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MonitoringKpiSkeleton key={i} />
          ))}
        </div>
        <MonitoringFilterBarSkeleton selects={4} />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-full max-w-md" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground">Failed to load alerts.</p>
      </div>
    );
  }

  const allAlerts = data.alerts ?? [];
  const summary = data.summary ?? {
    total_firing: 0,
    critical_firing: 0,
    warning_firing: 0,
  };

  const alerts =
    dashboardFilter === "all"
      ? allAlerts
      : allAlerts.filter((a) => a.dashboard === dashboardFilter);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <StatCard
          label="Active alerts"
          value={summary.total_firing}
          icon={
            summary.total_firing > 0 ? (
              <Bell className="h-4 w-4 text-red-500" />
            ) : (
              <BellOff className="h-4 w-4 text-green-500" />
            )
          }
          tone={summary.total_firing > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Needs attention now"
          value={summary.critical_firing}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          tone={summary.critical_firing > 0 ? "danger" : "default"}
          description="critical"
        />
        <StatCard
          label="Worth a look"
          value={summary.warning_firing}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          tone={summary.warning_firing > 0 ? "warning" : "default"}
          description="warnings"
        />
        <StatCard
          label="Shown below"
          value={allAlerts.length}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description={`updated ${formatDate(data.generated_at)}`}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={dashboardFilter}
          onValueChange={(v) => setDashboardFilter(v as typeof dashboardFilter)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Dashboard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All dashboards</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="risk">Risk</SelectItem>
            <SelectItem value="model_ops">Model Ops</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={severityFilter}
          onValueChange={(v) => setSeverityFilter(v as typeof severityFilter)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={limit} onValueChange={setLimit}>
          <SelectTrigger className="w-[84px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMIT_OPTIONS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto"
        >
          <RefreshCcw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              No alerts match the current filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertRow({ alert }: { alert: AlertDetail }) {
  const status = String(alert.status).toLowerCase();
  const severity = String(alert.severity).toLowerCase();

  return (
    <Card
      className={`border-l-4 ${borderClass(status, severity)}`}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {status === "firing" ? (
              <Bell className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium text-sm">
                {alert.metric.replace(/_/g, " ")}
              </h4>
              <Badge
                variant="outline"
                className={`capitalize text-xs ${severityClass(severity)}`}
              >
                {severity}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs">
                {status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {DASHBOARD_LABEL[alert.dashboard] ?? alert.dashboard}
              </Badge>
              {alert.feature && (
                <Badge
                  variant="outline"
                  className="text-xs bg-muted/50 font-mono"
                >
                  {alert.feature}
                </Badge>
              )}
              {alert.model_type && (
                <Badge
                  variant="outline"
                  className="text-xs bg-muted/50 font-mono"
                >
                  {prettyModelType(alert.model_type)}
                </Badge>
              )}
            </div>

            {alert.detail && (
              <p className="text-sm text-muted-foreground mt-2">
                {alert.detail}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-muted-foreground">
              <div>
                <span className="mr-1">Current</span>
                <span className="font-mono text-foreground">
                  {alert.current_value}
                </span>
              </div>
              <div>
                <span className="mr-1">Limit</span>
                <span className="font-mono">{alert.threshold}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Started {formatDate(alert.created_at)}</span>
              </div>
              {alert.resolved_at && (
                <div className="text-green-600">
                  Cleared {formatDate(alert.resolved_at)}
                </div>
              )}
            </div>

            {alert.recommended_action && (
              <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
                <span className="font-medium">Suggested next step:</span>{" "}
                {alert.recommended_action}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
