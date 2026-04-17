"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Shield,
  Filter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  formatPercent,
  toDisplayPercent,
} from "@/lib/monitoring-display";
import { MonitoringTimeseriesChart } from "@/components/admin/monitoring/monitoring-timeseries-chart";

/** GET /v1/monitoring/infrastructure — period: 1h | 6h | 24h | 7d | 30d (default 24h) */
const PERIOD_OPTIONS = [
  { value: "1h", label: "Last 1 Hour" },
  { value: "6h", label: "Last 6 Hours" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export function InfrastructureTab() {
  const [period, setPeriod] = useState("24h");
  const [endpointDraft, setEndpointDraft] = useState("");
  const [endpoint, setEndpoint] = useState<string | undefined>(undefined);

  const { data, isLoading, isError } = useQuery({
    queryKey: MONITORING_KEYS.infrastructure({ period, endpoint }),
    queryFn: () =>
      monitoringService.getInfrastructure({
        period,
        endpoint: endpoint?.trim() || undefined,
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
          Failed to load infrastructure data. Please try again.
        </p>
      </div>
    );
  }

  const summary = data?.summary ?? {};
  const endpoints = data?.endpoints ?? [];
  const latencyTs = data?.latency_timeseries ?? [];
  const errorTs = data?.error_rate_timeseries ?? [];
  const volumeTs = data?.request_volume_timeseries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 max-w-md flex-1">
          <Label htmlFor="infra-endpoint" className="text-muted-foreground">
            Endpoint path filter
          </Label>
          <p className="text-xs text-muted-foreground">
            Optional. Matches GET{" "}
            <code className="text-xs bg-muted px-1 rounded">endpoint</code>{" "}
            query per OpenAPI.
          </p>
          <div className="flex gap-2">
            <Input
              id="infra-endpoint"
              placeholder="e.g. /v1/score-requests"
              value={endpointDraft}
              onChange={(e) => setEndpointDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEndpoint(endpointDraft.trim() || undefined);
                }
              }}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setEndpoint(endpointDraft.trim() || undefined)
              }
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Apply</span>
            </Button>
          </div>
        </div>
        <div className="flex items-end gap-2">
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
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_requests != null
                ? summary.total_requests.toLocaleString()
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMs(summary.avg_latency_ms ?? null)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P95 Latency</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMs(summary.p95_latency_ms ?? null)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P99 Latency</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMs(summary.p99_latency_ms ?? null)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(summary.error_rate ?? null, 2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(summary.uptime_percent ?? null, 2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MonitoringTimeseriesChart
          title="Latency"
          description="Response time trend"
          data={latencyTs}
          valueFormatter={(n) => `${Math.round(n)}ms`}
        />
        <MonitoringTimeseriesChart
          title="Error rate"
          description="Failed request share over time"
          data={errorTs}
          valueFormatter={(n) =>
            n <= 1 ? `${(n * 100).toFixed(2)}%` : `${n.toFixed(2)}%`
          }
        />
        <MonitoringTimeseriesChart
          title="Request volume"
          description="Throughput over time"
          data={volumeTs}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoint metrics</CardTitle>
          <CardDescription>
            Per-endpoint latency and error rates for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg Latency</TableHead>
                <TableHead className="text-right">Error Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  title="No endpoint metrics"
                  description="The API returned no per-endpoint rows for this filter. Try another period or clear the path filter."
                />
              ) : (
                endpoints.map((ep, idx) => (
                  <TableRow key={`${ep.path}-${ep.method}-${idx}`}>
                    <TableCell className="font-mono text-xs max-w-[280px] truncate">
                      {ep.path}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {ep.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {ep.total_requests?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMs(ep.avg_latency_ms ?? null)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ep.error_rate != null ? (
                        <span
                          className={
                            (() => {
                              const p = toDisplayPercent(ep.error_rate);
                              return p != null && p > 5;
                            })()
                              ? "text-destructive font-semibold"
                              : ""
                          }
                        >
                          {formatPercent(ep.error_rate, 2)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
