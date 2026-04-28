"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  FileSpreadsheet,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { trainingService, TRAINING_KEYS } from "@/lib/training-service";

export default function TrainingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const pollInterval = useQuery({
    queryKey: TRAINING_KEYS.uploadStatus(id),
    queryFn: () => trainingService.getUploadStatus(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "processing" || status === "queued" ? 3000 : false;
    },
  }).data?.status;

  // Queries
  const { data: upload, isLoading: isLoadingUpload } = useQuery({
    queryKey: TRAINING_KEYS.uploadDetail(id),
    queryFn: () => trainingService.getUpload(id),
  });

  // Handle status change from polling
  useEffect(() => {
    if (pollInterval && pollInterval !== upload?.status) {
      queryClient.invalidateQueries({
        queryKey: TRAINING_KEYS.uploadDetail(id),
      });
    }
  }, [pollInterval, upload?.status, id, queryClient]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "processed":
        return { className: "bg-green-600 hover:bg-green-700" };
      case "processing":
        return { variant: "secondary" as const, className: "animate-pulse" };
      case "failed":
        return { variant: "destructive" as const, className: "" };
      default:
        return { variant: "outline" as const, className: "" };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (isLoadingUpload) {
    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => router.push("/training")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Training Data
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-64" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Dataset Info card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <div key={row}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  {row < 5 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data Quality Report card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-sm" />
                <Skeleton className="h-5 w-44" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-center space-y-3">
                  <Skeleton className="mx-auto h-16 w-32" />
                  <Skeleton className="mx-auto h-4 w-40" />
                  <Skeleton className="h-2 w-full mt-4" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-3 w-32" />
                  {[0, 1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="flex items-center justify-between"
                    >
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!upload) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">Failed to load dataset details.</p>
        <Button variant="outline" onClick={() => router.push("/training")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          className="w-fit"
          onClick={() => router.push("/training")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Training Data
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{upload.fileName}</h1>
                <Badge
                  {...getStatusBadgeStyle(upload.status)}
                  className={`capitalize ${getStatusBadgeStyle(upload.status).className}`}
                >
                  {upload.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Uploaded on{" "}
                {format(new Date(upload.createdAt), "MMMM d, yyyy 'at' HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dataset Info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Dataset Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Source" value={upload.dataSourceName} />
            <Separator />
            <DetailRow
              label="Format"
              value={upload.fileFormat.toUpperCase()}
              mono
            />
            <Separator />
            <DetailRow
              label="File Size"
              value={formatFileSize(upload.fileSizeBytes)}
            />
            <Separator />
            <DetailRow
              label="Total Records"
              value={upload.recordCount.toLocaleString()}
            />
            <Separator />
            <DetailRow
              label="Valid Records"
              value={upload.validRecordCount.toLocaleString()}
            />
            <Separator />
            <DetailRow
              label="Features Mapped"
              value={`${upload.featuresMapped} / ${upload.targetFeaturesTotal}`}
            />
          </CardContent>
        </Card>

        {/* Data Quality Report card */}
        <Card className={upload.qualityScore === 0 ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Data Quality Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="text-center space-y-2">
                <div
                  className={`text-6xl font-black ${
                    upload.qualityScore >= 90
                      ? "text-green-600"
                      : upload.qualityScore >= 70
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {upload.qualityScore}%
                </div>
                <p className="text-sm font-medium">Overall Quality Score</p>
                <Progress value={upload.qualityScore} className="h-2 mt-4" />
              </div>

              <div className="space-y-4">
                {(() => {
                  const metrics = buildQualityMetrics(upload.qualityReport);
                  return metrics.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider">
                        Detailed Metrics
                      </p>
                      <div className="space-y-4">
                        {metrics.map(({ label, value }) => (
                          <div
                            key={label}
                            className="flex justify-between items-center gap-3 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {label}
                            </span>
                            <span className="font-medium text-right break-words">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-lg text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">
                        Quality analysis in progress...
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {upload.status === "failed" && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Processing Error
                </p>
                <p className="text-sm text-red-700 leading-relaxed">
                  {upload.errorMessage ||
                    upload.rejectionReason ||
                    "Unknown error occurred during processing."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing status card */}
      {upload.status === "processing" && (
        <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative bg-primary/10 p-6 rounded-full">
              <Clock className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Analyzing Dataset...</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            Our AI agents are parsing your file, extracting samples, and
            evaluating data integrity.
          </p>
          <Progress value={45} className="w-[200px] mt-6 h-1.5" />
        </Card>
      )}
    </div>
  );
}

// ---- Helper components ----

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

// =============================================================================
// Quality-report formatter
//
// `quality_report` is a heterogeneous payload — top-level values mix scalars
// (`timestamp`, `quality_score`) with nested sections (`pii_quality`,
// `data_quality`, `file_quality`, `schema_quality`). This formatter walks
// the known shape and flattens it into a list of human-readable
// {label, value} pairs, summarising each nested section.
// =============================================================================

interface QualityMetric {
  label: string;
  value: string;
}

function prettifyKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\bpii\b/i, "PII")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatRatio(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function summarizeSection(
  key: string,
  obj: Record<string, unknown>,
): string | null {
  if (key === "pii_quality") {
    const fields = Number(obj.pii_fields_detected ?? 0);
    const anon = Boolean(obj.anonymization_applied);
    return `${fields} field${fields === 1 ? "" : "s"} · ${
      anon ? "anonymized" : "raw"
    }`;
  }
  if (key === "data_quality") {
    const cols = Number(obj.total_columns ?? 0);
    const completeness = Number(obj.overall_completeness_score ?? 0);
    return `${cols} column${cols === 1 ? "" : "s"} · ${formatRatio(
      completeness,
    )} complete`;
  }
  if (key === "file_quality") {
    const encoding = String(obj.encoding ?? "—");
    const size = Number(obj.file_size_bytes ?? 0);
    return `${encoding} · ${formatBytes(size)}`;
  }
  if (key === "schema_quality") {
    const fmt = String(obj.format ?? "—");
    const cols = Number(obj.column_count ?? 0);
    return `${fmt} · ${cols} column${cols === 1 ? "" : "s"}`;
  }
  return null;
}

export function buildQualityMetrics(
  report: Record<string, unknown> | null | undefined,
): QualityMetric[] {
  if (!report) return [];

  const out: QualityMetric[] = [];

  for (const [key, value] of Object.entries(report)) {
    // Skip the duplicated quality_score scalar — the big % already shows it.
    if (key === "quality_score") continue;

    if (value == null) {
      out.push({ label: prettifyKey(key), value: "—" });
      continue;
    }

    if (key === "timestamp" && typeof value === "string") {
      const d = new Date(value);
      out.push({
        label: "Generated",
        value: Number.isNaN(d.getTime())
          ? value
          : format(d, "MMM d, yyyy HH:mm"),
      });
      continue;
    }

    if (typeof value === "boolean") {
      out.push({ label: prettifyKey(key), value: value ? "Yes" : "No" });
      continue;
    }

    if (typeof value === "number") {
      const isRatio = value >= 0 && value <= 1;
      out.push({
        label: prettifyKey(key),
        value: isRatio ? formatRatio(value) : value.toLocaleString(),
      });
      continue;
    }

    if (typeof value === "string") {
      out.push({ label: prettifyKey(key), value });
      continue;
    }

    if (typeof value === "object") {
      const summary = summarizeSection(key, value as Record<string, unknown>);
      out.push({ label: prettifyKey(key), value: summary ?? "—" });
    }
  }

  return out;
}
