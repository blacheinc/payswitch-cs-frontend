"use client";

import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Loader2,
  XCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROUTES } from "@/lib/constant";
import type { BatchJobListItem, BatchJobStatus } from "@/lib/score-service";

interface BatchJobsTableProps {
  jobs: BatchJobListItem[];
  isLoading?: boolean;
  isError?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

export function getBatchJobStatusBadge(status: BatchJobStatus) {
  const config: Record<
    BatchJobStatus,
    {
      variant: "success" | "secondary" | "destructive" | "outline";
      icon: React.ReactNode;
      label: string;
    }
  > = {
    completed: {
      variant: "success",
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      label: "Completed",
    },
    processing: {
      variant: "secondary",
      icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />,
      label: "Processing",
    },
    queued: {
      variant: "outline",
      icon: <Clock className="w-3 h-3 mr-1" />,
      label: "Queued",
    },
    failed: {
      variant: "destructive",
      icon: <XCircle className="w-3 h-3 mr-1" />,
      label: "Failed",
    },
    cancelled: {
      variant: "outline",
      icon: <Ban className="w-3 h-3 mr-1" />,
      label: "Cancelled",
    },
  };
  const cfg = config[status] ?? config.queued;
  return (
    <Badge variant={cfg.variant}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

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

export function BatchJobsTable({
  jobs,
  isLoading,
  isError,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
}: BatchJobsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load batch jobs. Please try again.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableEmpty
                colSpan={8}
                title="No batch jobs yet"
                description="Submit a batch of applicants to see jobs here."
              />
            ) : (
              jobs.map((job) => (
                <TableRow key={job.jobId}>
                  <TableCell>
                    <Link
                      href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk/${job.jobId}`}
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {job.jobId}
                    </Link>
                  </TableCell>
                  <TableCell>{getBatchJobStatusBadge(job.status)}</TableCell>
                  <TableCell className="text-right">{job.total}</TableCell>
                  <TableCell className="text-right text-green-600">
                    {job.completed}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {job.failed}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-nowrap">
                    {formatDateTime(job.requestedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-nowrap">
                    {formatDateTime(job.completedAt)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk/${job.jobId}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
