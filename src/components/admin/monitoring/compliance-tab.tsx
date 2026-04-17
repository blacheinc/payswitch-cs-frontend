"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  AlertTriangle,
  Shield,
  FileText,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { formatPercent } from "@/lib/monitoring-display";
import { MonitoringTimeseriesChart } from "@/components/admin/monitoring/monitoring-timeseries-chart";

/** GET /v1/monitoring/compliance — period: 7d | 30d | 90d (default 30d) */
const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

const FAIRNESS_STYLES: Record<
  string,
  { className: string; icon: React.ReactNode }
> = {
  pass: {
    className: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle className="mr-1 h-3 w-3" />,
  },
  warning: {
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <AlertCircle className="mr-1 h-3 w-3" />,
  },
  fail: {
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="mr-1 h-3 w-3" />,
  },
};

export function ComplianceTab() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: MONITORING_KEYS.compliance({ period }),
    queryFn: () => monitoringService.getCompliance({ period }),
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
          Failed to load compliance dashboard data.
        </p>
      </div>
    );
  }

  const summary = data?.summary ?? {};
  const fairnessMetrics = Array.isArray(data?.fairness_metrics)
    ? data.fairness_metrics
    : [];
  const dqTs = data?.data_quality_timeseries ?? [];
  const piiCount = summary.pii_incidents ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Audit Log Volume
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.audit_log_count != null
                ? summary.audit_log_count.toLocaleString()
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fairness Score
            </CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercent(summary.fairness_score ?? null, 1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Data Quality Avg
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercent(summary.data_quality_avg ?? null, 1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              PII Incidents
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${piiCount > 0 ? "text-destructive" : "text-green-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${piiCount > 0 ? "text-destructive" : "text-green-600"}`}
            >
              {summary.pii_incidents != null ? summary.pii_incidents : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <MonitoringTimeseriesChart
        title="Data quality"
        description="Trend from GET /v1/monitoring/compliance"
        data={dqTs}
        valueFormatter={(n) => formatPercent(n, 1)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Fairness metrics</CardTitle>
          <CardDescription>
            Disparate impact analysis across protected attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attribute</TableHead>
                <TableHead className="text-right">
                  Disparate Impact
                </TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fairnessMetrics.length === 0 ? (
                <TableEmpty
                  colSpan={3}
                  title="No fairness rows"
                  description="The API returned no fairness metric rows for this period."
                />
              ) : (
                fairnessMetrics.map((fm) => {
                  const key = String(fm.status ?? "pass").toLowerCase();
                  const style = FAIRNESS_STYLES[key] ?? FAIRNESS_STYLES.pass;
                  return (
                    <TableRow key={fm.attribute}>
                      <TableCell className="font-medium capitalize">
                        {fm.attribute?.replace(/_/g, " ") ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fm.disparate_impact != null
                          ? fm.disparate_impact.toFixed(4)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`capitalize ${style.className}`}
                        >
                          {style.icon}
                          {key}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
