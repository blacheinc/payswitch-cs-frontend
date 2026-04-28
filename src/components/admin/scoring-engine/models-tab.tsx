"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BrainCircuit,
  Trophy,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCcw,
  ShieldCheck,
  Banknote,
  Wallet,
  Tag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { modelService, MODEL_KEYS } from "@/lib/monitoring-service";
import { formatDate } from "@/lib/utils";
import type { ChampionModelEntry } from "@/types/monitoring-types";

const MODEL_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  credit_risk: {
    label: "Credit Risk",
    icon: <BrainCircuit className="h-5 w-5" />,
    color: "text-blue-600",
  },
  fraud_detection: {
    label: "Fraud Detection",
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "text-red-600",
  },
  loan_amount: {
    label: "Loan Amount",
    icon: <Banknote className="h-5 w-5" />,
    color: "text-green-600",
  },
  income_verification: {
    label: "Income Verification",
    icon: <Wallet className="h-5 w-5" />,
    color: "text-purple-600",
  },
};

const METRIC_LABELS: Record<string, string> = {
  auc: "AUC",
  f1: "F1 Score",
  precision: "Precision",
  recall: "Recall",
  log_loss: "Log Loss",
  fairness_di_ratio: "Fairness DI Ratio",
  fairness_fnr_gap: "Fairness FNR Gap",
  fairness_passed: "Fairness Passed",
};

function isPercentageMetric(key: string) {
  return ["auc", "f1", "precision", "recall", "fairness_di_ratio"].includes(
    key,
  );
}

export function ModelsTab() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: MODEL_KEYS.current(),
    queryFn: () => modelService.getChampionModels(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end gap-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-1 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ModelDetailCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            No champion models found. A training run must complete before
            model metadata is available.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Last updated + refresh */}
      <div className="flex items-center justify-end gap-3">
        {data.updated_at && (
          <span className="text-xs text-muted-foreground">
            Last updated: {formatDate(data.updated_at)}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCcw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 md:grid-cols-4">
        {data.models.map((model) => {
          const meta = MODEL_META[model.model_type];
          return (
            <Card key={model.model_type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {meta?.label ?? model.model_type}
                </CardTitle>
                <div className={meta?.color ?? "text-primary"}>
                  {meta?.icon ?? <BrainCircuit className="h-5 w-5" />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">v{model.version}</span>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    <Trophy className="mr-1 h-3 w-3" />
                    {model.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                  {model.registry_name}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Model detail cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {data.models.map((model) => (
          <ModelCard key={model.model_type} model={model} />
        ))}
      </div>
    </div>
  );
}

function ModelCard({ model }: { model: ChampionModelEntry }) {
  const meta = MODEL_META[model.model_type];
  const metricEntries = Object.entries(model.metrics).filter(
    ([, v]) => v != null,
  );
  const tagEntries = Object.entries(model.tags ?? {});

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-muted ${meta?.color ?? "text-primary"}`}
            >
              {meta?.icon ?? <BrainCircuit className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle>{meta?.label ?? model.model_type}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {model.registry_name}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            {model.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Version
            </p>
            <p className="text-lg font-bold">v{model.version}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Created
            </p>
            <p className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              {formatDate(model.created_at)}
            </p>
          </div>
        </div>

        {metricEntries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Training Metrics</h4>
              <div className="space-y-3">
                {metricEntries.map(([key, value]) => {
                  const isPct = isPercentageMetric(key);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {METRIC_LABELS[key] ?? key.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold">
                          {isPct
                            ? `${(value * 100).toFixed(2)}%`
                            : typeof value === "number"
                              ? value.toFixed(4)
                              : value}
                        </span>
                      </div>
                      {isPct && (
                        <Progress value={value * 100} className="h-1.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tagEntries.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {tagEntries.map(([key, value]) => (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="font-mono text-xs"
                  >
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {metricEntries.length === 0 && tagEntries.length === 0 && (
          <>
            <Separator />
            <p className="text-sm text-muted-foreground text-center py-4">
              No metrics or tags available for this model
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton placeholder for a single model detail card. */
function ModelDetailCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
