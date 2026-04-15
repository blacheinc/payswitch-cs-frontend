"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  AlertTriangle,
  Trophy,
  Activity,
  GitBranch,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";

const MODEL_TYPE_OPTIONS = [
  { value: "all", label: "All Models" },
  { value: "credit_risk", label: "Credit Risk" },
  { value: "fraud_detection", label: "Fraud Detection" },
  { value: "loan_amount", label: "Loan Amount" },
  { value: "income_verification", label: "Income Verification" },
];

const PERIOD_OPTIONS = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
];

const DRIFT_STATUS_STYLES: Record<
  string,
  { className: string; icon: React.ReactNode }
> = {
  ok: {
    className: "bg-green-50 text-green-700 border-green-200",
    icon: <CheckCircle className="mr-1 h-3 w-3" />,
  },
  warning: {
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <AlertCircle className="mr-1 h-3 w-3" />,
  },
  critical: {
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="mr-1 h-3 w-3" />,
  },
};

export function ModelOpsTab() {
  const [modelType, setModelType] = useState("all");
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, isError } = useQuery({
    queryKey: MONITORING_KEYS.modelOps({
      model_type: modelType === "all" ? undefined : modelType,
      period,
    }),
    queryFn: () =>
      monitoringService.getModelOps({
        model_type: modelType === "all" ? undefined : modelType,
        period,
      }),
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

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
          Failed to load ModelOps dashboard data.
        </p>
      </div>
    );
  }

  const champion = data.champion ?? {};
  const driftMetrics = data.drift_metrics ?? [];
  const retrainingHistory = data.retraining_history ?? [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-end gap-3">
        <Select value={modelType} onValueChange={setModelType}>
          <SelectTrigger className="w-48">
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

      {/* Champion summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <CardTitle>Champion Model</CardTitle>
              <CardDescription>
                Currently deployed model performance summary
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Version
              </p>
              <p className="text-lg font-bold">
                {champion.model_version ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Type
              </p>
              <p className="text-sm font-medium capitalize">
                {champion.model_type?.replace(/_/g, " ") ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                AUC
              </p>
              <p className="text-lg font-bold">
                {champion.auc != null ? champion.auc.toFixed(4) : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                KS
              </p>
              <p className="text-lg font-bold">
                {champion.ks != null ? champion.ks.toFixed(4) : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Gini
              </p>
              <p className="text-lg font-bold">
                {champion.gini != null ? champion.gini.toFixed(4) : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Predictions
              </p>
              <p className="text-lg font-bold">
                {champion.predictions_count != null
                  ? champion.predictions_count.toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feature Drift */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Feature Drift</CardTitle>
                <CardDescription>
                  Data drift scores for key model features
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {driftMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No drift data available
              </p>
            ) : (
              <div className="space-y-4">
                {driftMetrics.map((dm) => {
                  const style =
                    DRIFT_STATUS_STYLES[dm.status] ?? DRIFT_STATUS_STYLES.ok;
                  return (
                    <div key={dm.feature} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate max-w-[200px]">
                          {dm.feature}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {dm.drift_score?.toFixed(4) ?? "—"}
                          </span>
                          <Badge
                            variant="outline"
                            className={`capitalize ${style.className}`}
                          >
                            {style.icon}
                            {dm.status}
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={Math.min(
                          (dm.drift_score ?? 0) * 100,
                          100,
                        )}
                        className="h-1.5"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retraining History */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Retraining History</CardTitle>
                <CardDescription>
                  Recent model retraining events
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>New Version</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retrainingHistory.length === 0 ? (
                  <TableEmpty
                    colSpan={4}
                    title="No retraining events"
                    description="No retraining has been triggered in this period."
                  />
                ) : (
                  retrainingHistory.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-sm">
                        {event.trigger_reason ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            event.status === "completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : event.status === "failed"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200"
                          }
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {event.new_model_version ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(event.triggered_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
