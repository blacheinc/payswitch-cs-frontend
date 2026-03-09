"use client";

import { format } from "date-fns";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
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

import type { ScoreRequest } from "@/types/models";
import type { PaginatedResponse } from "@/types/api-type";

interface AdminScoreRequestsTableProps {
  data: PaginatedResponse<ScoreRequest> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function AdminScoreRequestsTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
}: AdminScoreRequestsTableProps) {
  const requests = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
      }
    > = {
      completed: {
        variant: "default",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      processing: {
        variant: "secondary",
        icon: <Clock className="w-3 h-3 mr-1 animate-spin" />,
      },
      pending: { variant: "outline", icon: <Clock className="w-3 h-3 mr-1" /> },
      failed: {
        variant: "destructive",
        icon: <XCircle className="w-3 h-3 mr-1" />,
      },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const getRiskBadge = (risk?: string | null) => {
    if (!risk) return <span className="text-muted-foreground">—</span>;

    const colors: Record<string, string> = {
      very_low: "bg-green-500/10 text-green-600 border-green-200",
      low: "bg-lime-500/10 text-lime-600 border-lime-200",
      medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      high: "bg-orange-500/10 text-orange-600 border-orange-200",
      very_high: "bg-red-500/10 text-red-600 border-red-200",
    };

    const label = risk
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return (
      <Badge variant="outline" className={colors[risk]}>
        {label}
      </Badge>
    );
  };

  const getDecisionBadge = (decision?: string | null) => {
    if (!decision) return <span className="text-muted-foreground">—</span>;

    const styles: Record<string, string> = {
      approved: "text-green-600",
      declined: "text-red-600",
      referred: "text-yellow-600",
      pending: "text-muted-foreground",
    };

    return (
      <span
        className={`font-medium capitalize ${styles[decision] || styles.pending}`}
      >
        {decision}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

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
        Failed to load score requests. Please try again.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request ID</TableHead>
            <TableHead>Applicant</TableHead>
            <TableHead>Organization ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Decision</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableEmpty
              colSpan={8}
              title="No score requests found"
              description="There are no score requests to display."
            />
          ) : (
            requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <span className="font-medium text-primary">{request.id}</span>
                  {request.referenceId && (
                    <p className="text-xs text-muted-foreground">
                      {request.referenceId}
                    </p>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {request.applicantName}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {request.organizationId}
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-center">
                  {request.scoreValue ? (
                    <span className="font-semibold">{request.scoreValue}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{getRiskBadge(request.riskCategory)}</TableCell>
                <TableCell>
                  {/* For Admin View, decision might be nested under `decision.decision` but this model seems partial without it so we map manually from any known object if it existed.
                      As ScoreRequest schema doesn't have `decision`, we only show `-` or adapt later. */}
                  <span className="text-muted-foreground">—</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(request.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({data?.total ?? 0} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
