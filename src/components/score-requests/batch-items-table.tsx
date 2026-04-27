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
  AlertCircle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES } from "@/lib/constant";
import { formatDate } from "@/lib/utils";
import type { BatchResultItem, BatchItemStatus } from "@/lib/score-service";

interface BatchItemsTableProps {
  items: BatchResultItem[];
  isLoading?: boolean;
  isError?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}

function getItemStatusBadge(status: BatchItemStatus) {
  const config: Record<
    BatchItemStatus,
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
    pending: {
      variant: "outline",
      icon: <Clock className="w-3 h-3 mr-1" />,
      label: "Pending",
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
  const cfg = config[status] ?? config.pending;
  return (
    <Badge variant={cfg.variant}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

const ERROR_CODE_LABELS: Record<string, string> = {
  bureau_failed: "Bureau lookup failed",
  scoring_error: "Scoring pipeline error",
};

function formatErrorCode(code: string): string {
  return (
    ERROR_CODE_LABELS[code] ||
    code.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function getApplicantName(payload: Record<string, unknown>): string {
  const fullName = payload?.full_name || payload?.fullName;
  if (typeof fullName === "string" && fullName.trim()) return fullName;
  const id = payload?.identification;
  if (typeof id === "string" && id) return id;
  const phone = payload?.phone_number || payload?.phoneNumber;
  if (typeof phone === "string" && phone) return phone;
  return "—";
}

export function BatchItemsTable({
  items,
  isLoading,
  isError,
  page = 1,
  pageSize = 50,
  total = 0,
  onPageChange,
}: BatchItemsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) {
    return (
      <TableSkeleton
        headers={[
          "#",
          "Applicant",
          "Status",
          "Tracking ID",
          "Error",
          "Finished",
          "",
        ]}
      />
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load items. Please try again.
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty
                colSpan={7}
                title="No items yet"
                description="Items will appear here as they are processed."
              />
            ) : (
              items.map((item) => {
                const applicantName = getApplicantName(item.payload);
                const dob =
                  (item.payload?.date_of_birth as string | undefined) ??
                  (item.payload?.dateOfBirth as string | undefined);
                return (
                  <TableRow key={item.index}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.index + 1}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{applicantName}</p>
                      {dob && (
                        <p className="text-xs text-muted-foreground">
                          DOB: {dob}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{getItemStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {item.scoreTrackingId ? (
                        <Link
                          href={`${ROUTES.ORG.SCORE_REQUESTS}/${item.scoreTrackingId}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {item.scoreTrackingId}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.errorCode ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-xs text-red-600 cursor-help">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>{formatErrorCode(item.errorCode)}</span>
                            </div>
                          </TooltipTrigger>
                          {item.errorMessage && (
                            <TooltipContent className="max-w-sm">
                              <p className="text-xs">{item.errorMessage}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground text-nowrap">
                      {formatDate(item.completedAt)}
                    </TableCell>
                    <TableCell>
                      {item.scoreTrackingId ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`${ROUTES.ORG.SCORE_REQUESTS}/${item.scoreTrackingId}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
          unitLabel="items"
        />
      )}
    </TooltipProvider>
  );
}
