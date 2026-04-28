"use client";

import Link from "next/link";
import {
  CheckCircle,
  Clock,
  Loader2,
  MoreVertical,
  XCircle,
  Ban,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/lib/constant";
import { formatDate } from "@/lib/utils";
import type { BatchJobListItem, BatchJobStatus } from "@/lib/score-service";

interface BatchJobsTableProps {
  jobs: BatchJobListItem[];
  isLoading?: boolean;
  isError?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /** Called when the user picks a new "rows per page". Caller is expected
   *  to also reset `page` to 1 to avoid landing on a non-existent page. */
  onPageSizeChange?: (pageSize: number) => void;
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

export function BatchJobsTable({
  jobs,
  isLoading,
  isError,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  onPageSizeChange,
}: BatchJobsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <TableSkeleton
        headers={[
          "Job ID",
          "Status",
          "Total",
          "Completed",
          "Failed",
          "Submitted",
          "Finished",
          "",
        ]}
      />
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
                    {formatDate(job.requestedAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-nowrap">
                    {formatDate(job.completedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk/${job.jobId}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {onPageChange && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
          perPage={pageSize}
          onPerPageChange={onPageSizeChange}
        />
      )}
    </>
  );
}
