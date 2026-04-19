"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  Loader2,
  RefreshCcw,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import {
  formatMs,
  formatNumber,
  formatPct,
  formatRelative,
} from "@/lib/monitoring-display";
import { MonitoringChart } from "@/components/admin/monitoring/monitoring-timeseries-chart";
import { StatCard } from "@/components/admin/monitoring/stat-card";
import { AlertInlineList } from "@/components/admin/monitoring/alert-inline";
import type {
  InfrastructurePeriod,
  InfraTimeseriesPoint,
} from "@/types/monitoring-types";

const PERIOD_OPTIONS: { value: InfrastructurePeriod; label: string }[] = [
  { value: "1h", label: "Last 1 hour" },
  { value: "6h", label: "Last 6 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const POLL_MS = 30_000; // per integration guide

function statusCodeTone(code: number): "success" | "warning" | "danger" {
  if (code >= 500) return "danger";
  if (code >= 400) return "warning";
  return "success";
}

export function InfrastructureTab() {
  const [period, setPeriod] = useState<InfrastructurePeriod>("24h");
  const [endpointDraft, setEndpointDraft] = useState("");
  const [endpoint, setEndpoint] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: MONITORING_KEYS.infrastructure({ period, endpoint }),
    queryFn: () =>
      monitoringService.getInfrastructure({
        period,
        endpoint: endpoint?.trim() || undefined,
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
          Failed to load infrastructure metrics. Please try again.
        </p>
      </div>
    );
  }

  const totalRequests = data.request_volume?.total ?? 0;
  const latency = data.latency ?? {
    p50_ms: 0,
    p95_ms: 0,
    p99_ms: 0,
    by_endpoint: [],
  };
  const errorRates = data.error_rates ?? { overall_pct: 0, by_status: [] };
  const timeseries = (data.timeseries ?? []) as InfraTimeseriesPoint[];
  const latencyByEndpoint = (latency.by_endpoint ?? []).slice(0, 10);
  const volumeByEndpoint = (data.request_volume?.by_endpoint ?? []).slice(0, 10);

  const errorTone =
    errorRates.overall_pct >= 1
      ? "danger"
      : errorRates.overall_pct >= 0.5
        ? "warning"
        : "success";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-sm">
            <label className="text-xs text-muted-foreground">
              Filter by endpoint
            </label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g. /v1/score-requests"
                value={endpointDraft}
                onChange={(e) => setEndpointDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEndpoint(endpointDraft.trim() || undefined);
                  }
                }}
                className="h-9 font-mono text-sm"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setEndpoint(endpointDraft.trim() || undefined)
                }
                className="shrink-0"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Apply</span>
              </Button>
              {endpoint && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEndpoint(undefined);
                    setEndpointDraft("");
                  }}
                  className="shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as InfrastructurePeriod)}
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
            title={`Updated ${formatRelative(data.generated_at)}`}
          >
            <RefreshCcw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <AlertInlineList alerts={data.alerts} title="Platform health alerts" />

      {/* KPI cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total requests"
          value={formatNumber(totalRequests)}
          icon={<Activity className="h-4 w-4 text-primary" />}
          description={`in the last ${period}`}
        />
        <StatCard
          label="Typical response"
          value={formatMs(latency.p50_ms)}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="median"
        />
        <StatCard
          label="Slowest 5%"
          value={formatMs(latency.p95_ms)}
          icon={<Zap className="h-4 w-4 text-yellow-500" />}
          description="95th percentile"
        />
        <StatCard
          label="Slowest 1%"
          value={formatMs(latency.p99_ms)}
          icon={<Zap className="h-4 w-4 text-orange-500" />}
          description="99th percentile"
          tone={latency.p99_ms >= 1000 ? "danger" : "default"}
        />
        <StatCard
          label="Error rate"
          value={formatPct(errorRates.overall_pct, 2)}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          tone={errorTone}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <MonitoringChart
        title="Traffic over time"
        description="Requests, errors, and slowest-1% response time per time slice"
        data={timeseries}
        xKey="bucket"
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Busiest endpoints</CardTitle>
            <CardDescription>
              Routes receiving the most traffic in this window
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volumeByEndpoint.length === 0 ? (
                    <TableEmpty
                      colSpan={3}
                      title="No traffic"
                      description="No endpoint activity for this filter."
                    />
                  ) : (
                    volumeByEndpoint.map((ep, idx) => (
                      <TableRow key={`${ep.endpoint}-${ep.method}-${idx}`}>
                        <TableCell className="font-mono text-xs max-w-[240px] truncate">
                          {ep.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase text-xs">
                            {ep.method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(ep.count)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Response times by endpoint</CardTitle>
            <CardDescription>
              Typical, slowest 5%, and slowest 1% per route
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Typical</TableHead>
                    <TableHead className="text-right">Slowest 5%</TableHead>
                    <TableHead className="text-right">Slowest 1%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latencyByEndpoint.length === 0 ? (
                    <TableEmpty
                      colSpan={4}
                      title="No response-time data"
                      description="No response-time data for this filter."
                    />
                  ) : (
                    latencyByEndpoint.map((ep, idx) => (
                      <TableRow key={`${ep.endpoint}-${idx}`}>
                        <TableCell className="font-mono text-xs max-w-[240px] truncate">
                          {ep.endpoint}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatMs(ep.p50_ms)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatMs(ep.p95_ms)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-sm ${
                            ep.p99_ms >= 1000 ? "text-red-600" : ""
                          }`}
                        >
                          {formatMs(ep.p99_ms)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Errors by response code</CardTitle>
          <CardDescription>
            Failed requests grouped by the status code returned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorRates.by_status.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No errors recorded in this window.
            </p>
          ) : (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
              {errorRates.by_status.map((row) => (
                <StatCard
                  key={row.status_code}
                  label={`Code ${row.status_code}`}
                  value={formatNumber(row.count)}
                  description={`${formatPct(row.pct, 2)} of traffic`}
                  tone={statusCodeTone(row.status_code)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
