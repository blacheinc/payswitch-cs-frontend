"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Database,
  FileText,
  Loader2,
  RefreshCcw,
  Scale,
  UserCheck,
} from "lucide-react";

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
import { formatNumber, formatPct } from "@/lib/monitoring-display";
import { StatCard } from "@/components/admin/monitoring/stat-card";
import { AlertInlineList } from "@/components/admin/monitoring/alert-inline";
import type { CompliancePeriod } from "@/types/monitoring-types";

const PERIOD_OPTIONS: { value: CompliancePeriod; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const POLL_MS = 10 * 60_000;

export function ComplianceTab() {
  const [period, setPeriod] = useState<CompliancePeriod>("30d");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: MONITORING_KEYS.compliance({ period }),
    queryFn: () => monitoringService.getCompliance({ period }),
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
          Failed to load compliance data.
        </p>
      </div>
    );
  }

  const fairness = data.fairness_metrics?.demographic_parity;
  const ageGroups = fairness?.approval_rate_by_age_group ?? [];
  const maxDisparity = fairness?.max_disparity_pct ?? 0;
  const audit = data.audit_log ?? {
    total_decisions_logged: 0,
    decisions_with_full_explainability: 0,
    coverage_pct: 0,
    error_decisions: 0,
    avg_data_quality_score: 0,
    dqs_p25: 0,
  };
  const dsr = data.data_subject_requests ?? {
    total: 0,
    pending: 0,
    completed: 0,
    avg_resolution_days: 0,
  };

  const maxApproval = Math.max(1, ...ageGroups.map((g) => g.approval_rate_pct));

  const disparityTone =
    maxDisparity >= 25 ? "danger" : maxDisparity >= 15 ? "warning" : "success";
  const dqsTone =
    audit.dqs_p25 < 0.6
      ? "warning"
      : audit.dqs_p25 < 0.7
        ? "default"
        : "success";

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as CompliancePeriod)}
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

      <AlertInlineList alerts={data.alerts} title="Fairness & audit alerts" />

      {/* KPI row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Largest group gap"
          value={formatPct(maxDisparity, 1)}
          icon={<Scale className="h-4 w-4 text-primary" />}
          description="warns above 25%"
          tone={disparityTone}
        />
        <StatCard
          label="Audit trail coverage"
          value={formatPct(audit.coverage_pct, 1)}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
          description={`${formatNumber(audit.decisions_with_full_explainability)} of ${formatNumber(audit.total_decisions_logged)} fully logged`}
          tone={audit.coverage_pct >= 90 ? "success" : "warning"}
        />
        <StatCard
          label="Data quality"
          value={audit.avg_data_quality_score.toFixed(2)}
          icon={<Database className="h-4 w-4 text-primary" />}
          description={`weakest 25% at ${audit.dqs_p25.toFixed(2)}`}
          tone={dqsTone}
        />
        <StatCard
          label="Failed decisions"
          value={formatNumber(audit.error_decisions)}
          icon={
            <AlertTriangle
              className={`h-4 w-4 ${audit.error_decisions > 0 ? "text-destructive" : "text-green-500"}`}
            />
          }
          tone={audit.error_decisions > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Fairness by age group */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Approval rate by age group
            </CardTitle>
            <CardDescription>
              Checks that approvals are balanced across age groups · largest
              gap <strong>{formatPct(maxDisparity, 1)}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ageGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No age-group data for this window.
              </p>
            ) : (
              <div className="space-y-3">
                {ageGroups.map((g) => (
                  <div key={g.group} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{g.group}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatNumber(g.count)})
                        </span>
                      </div>
                      <span className="font-mono text-xs">
                        {formatPct(g.approval_rate_pct, 1)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(g.approval_rate_pct / maxApproval) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data subject requests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Data subject requests
            </CardTitle>
            <CardDescription>
              Requests from customers to access, correct, or delete their data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-semibold mt-1">
                  {formatNumber(dsr.total)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold mt-1 text-yellow-600">
                  {formatNumber(dsr.pending)}
                </p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold mt-1 text-green-600">
                  {formatNumber(dsr.completed)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Avg resolution time
              </span>
              <span className="font-medium">
                {dsr.avg_resolution_days > 0
                  ? `${dsr.avg_resolution_days.toFixed(1)} days`
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit log card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Audit log</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Decisions with a complete audit trail
              </span>
              <span className="font-mono">
                {formatPct(audit.coverage_pct, 1)}
              </span>
            </div>
            <Progress value={audit.coverage_pct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {formatNumber(audit.decisions_with_full_explainability)} of{" "}
              {formatNumber(audit.total_decisions_logged)} decisions have a
              full explanation attached.{" "}
              {formatNumber(audit.error_decisions)} decisions could not be
              scored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
