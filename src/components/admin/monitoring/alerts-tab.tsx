"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
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

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import type { AlertItem } from "@/types/monitoring-types";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "firing", label: "Firing" },
  { value: "resolved", label: "Resolved" },
  { value: "ok", label: "OK" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
];

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  firing: <Bell className="h-4 w-4 text-red-500" />,
  resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
  ok: <CheckCircle className="h-4 w-4 text-green-500" />,
};

const LIMIT_OPTIONS = [
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "200", label: "200" },
];

export function AlertsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [limit, setLimit] = useState("50");

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
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const alerts = data ?? [];
  const firingCount = alerts.filter(
    (a) => String(a.status).toLowerCase() === "firing",
  ).length;
  const criticalCount = alerts.filter(
    (a) =>
      String(a.severity).toLowerCase() === "critical" &&
      String(a.status).toLowerCase() === "firing",
  ).length;

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
          Failed to load alert feed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {firingCount > 0 ? (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              <Bell className="mr-1.5 h-3.5 w-3.5" />
              {firingCount} firing
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1"
            >
              <BellOff className="mr-1.5 h-3.5 w-3.5" />
              All clear
            </Badge>
          )}
          {criticalCount > 0 && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              {criticalCount} critical
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={limit} onValueChange={setLimit}>
            <SelectTrigger className="w-[72px]">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
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
      </div>

      {/* Alert list */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">
              No alerts match the current filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} formatDate={formatDate} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  formatDate,
}: {
  alert: AlertItem;
  formatDate: (d?: string | null) => string;
}) {
  const sev = String(alert.severity ?? "warning").toLowerCase();
  const severityStyle = SEVERITY_STYLES[sev] ?? SEVERITY_STYLES.warning;
  const st = String(alert.status ?? "ok").toLowerCase();
  const statusIcon = STATUS_ICONS[st] ?? STATUS_ICONS.ok;

  return (
    <Card
      className={`border-l-4 ${
        st === "firing" && sev === "critical"
          ? "border-l-red-500"
          : st === "firing"
            ? "border-l-yellow-500"
            : "border-l-green-500"
      }`}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="mt-0.5">{statusIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <Badge
                  variant="outline"
                  className={`capitalize text-xs ${severityStyle}`}
                >
                  {sev}
                </Badge>
                <Badge variant="outline" className="capitalize text-xs">
                  {st}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(alert.fired_at)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {alert.message}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-muted-foreground">
                Source: {alert.source}
              </span>
              {alert.resolved_at && (
                <span className="text-xs text-green-600">
                  Resolved: {formatDate(alert.resolved_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
