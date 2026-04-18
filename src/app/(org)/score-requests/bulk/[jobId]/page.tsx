"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES, PERMISSION_CODES } from "@/lib/constant";
import {
  BATCH_KEYS,
  scoreService,
  type BatchItemStatus,
} from "@/lib/score-service";
import { usePermissions } from "@/hooks/use-permissions";
import { getBatchJobStatusBadge } from "@/components/score-requests/batch-jobs-table";
import { BatchItemsTable } from "@/components/score-requests/batch-items-table";

const TERMINAL = new Set(["completed", "failed", "cancelled"]);

const ITEM_STATUS_OPTIONS: { value: BatchItemStatus | "all"; label: string }[] =
  [
    { value: "all", label: "All items" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "cancelled", label: "Cancelled" },
  ];

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BatchJobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [itemStatus, setItemStatus] = useState<BatchItemStatus | "all">("all");
  const [itemsPage, setItemsPage] = useState(1);
  const itemsPageSize = 50;

  const canCancel = can(PERMISSION_CODES.BATCH_SCORING.CANCEL);
  const canRead = can(PERMISSION_CODES.BATCH_SCORING.READ);

  // --- Status polling ---
  const statusQuery = useQuery({
    queryKey: BATCH_KEYS.detail(jobId),
    queryFn: () => scoreService.getBatchJobStatus(jobId),
    enabled: !!jobId && canRead,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      return TERMINAL.has(data.status) ? false : 3000;
    },
  });

  const job = statusQuery.data;
  const isTerminal = job ? TERMINAL.has(job.status) : false;

  // --- Results ---
  const resultsParams = {
    page: itemsPage,
    pageSize: itemsPageSize,
    status: itemStatus,
  };
  const resultsQuery = useQuery({
    queryKey: BATCH_KEYS.results(jobId, resultsParams),
    queryFn: () => scoreService.getBatchResults(jobId, resultsParams),
    enabled: !!jobId && canRead,
    refetchInterval: isTerminal ? false : 4000,
  });

  // --- Cancel mutation ---
  const cancelMutation = useMutation({
    mutationFn: () => scoreService.cancelBatchJob(jobId),
    onSuccess: (res) => {
      toast.success(
        `Job cancelled · ${res.cancelledItems} pending item${res.cancelledItems === 1 ? "" : "s"} stopped`,
      );
      queryClient.invalidateQueries({ queryKey: BATCH_KEYS.all });
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { status?: number; data?: { detail?: string } };
        message?: string;
      };
      if (err?.response?.status === 409) {
        toast.error("Job is already in a terminal state.");
      } else {
        toast.error(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to cancel job.",
        );
      }
    },
  });

  const counts = useMemo(() => {
    if (!job) return null;
    return job.items;
  }, [job]);

  // --- Render states ---
  if (!canRead) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have permission to view batch jobs.
        </p>
      </div>
    );
  }

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (statusQuery.isError || !job) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to batch list
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Failed to load job. It may not exist or you may not have access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono">{job.jobId}</h1>
              {getBatchJobStatusBadge(job.status)}
            </div>
            <p className="text-muted-foreground text-sm">
              Submitted {formatDateTime(job.requestedAt)}
              {job.completedAt &&
                ` · Finished ${formatDateTime(job.completedAt)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              statusQuery.refetch();
              resultsQuery.refetch();
            }}
            disabled={statusQuery.isFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${statusQuery.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {canCancel && !isTerminal && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={cancelMutation.isPending}
                >
                  {cancelMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel Job
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this batch job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pending items will be cancelled immediately. Items already
                    processing will finish naturally. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep running</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    className="bg-destructive text-white hover:bg-destructive/90"
                  >
                    Cancel job
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Progress</CardTitle>
              <CardDescription>
                {job.total} applicant{job.total === 1 ? "" : "s"} ·{" "}
                {job.progressPct}% complete
              </CardDescription>
            </div>
            <span className="font-mono text-sm">{job.progressPct}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={job.progressPct} className="h-2" />

          {counts && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <CountTile
                label="Pending"
                value={counts.pending}
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              />
              <CountTile
                label="Processing"
                value={counts.processing}
                icon={
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                }
              />
              <CountTile
                label="Completed"
                value={counts.completed}
                icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              />
              <CountTile
                label="Failed"
                value={counts.failed}
                icon={<XCircle className="h-4 w-4 text-red-600" />}
              />
              <CountTile
                label="Cancelled"
                value={counts.cancelled}
                icon={<Ban className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                {isTerminal
                  ? "All items finished."
                  : "Results stream in as items finish."}
              </CardDescription>
            </div>
            <Select
              value={itemStatus}
              onValueChange={(v) => {
                setItemStatus(v as BatchItemStatus | "all");
                setItemsPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {ITEM_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <BatchItemsTable
            items={resultsQuery.data?.items ?? []}
            total={resultsQuery.data?.total ?? 0}
            page={itemsPage}
            pageSize={itemsPageSize}
            isLoading={resultsQuery.isLoading}
            isError={resultsQuery.isError}
            onPageChange={setItemsPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CountTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
