"use client";

import Link from "next/link";
import {
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
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
import type { ScoreRequestItem } from "@/lib/score-service";

/** Alias for table consumers — rows come from `getScoreRequests` list mapping. */
export type OrganizationScoreRequest = ScoreRequestItem;

interface OrganizationScoreRequestsTableProps {
  requests: ScoreRequestItem[];
  isLoading?: boolean;
  isError?: boolean;
  // Pagination props
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  // View mode
  isCompact?: boolean; // For dashboard view
}

export function OrganizationScoreRequestsTable({
  requests,
  isLoading,
  isError,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  perPage,
  onPerPageChange,
  isCompact = false,
}: OrganizationScoreRequestsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "success" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
      }
    > = {
      completed: {
        variant: "success",
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

    const riskKey = risk.toLowerCase();
    const label = risk
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return (
      <Badge variant="outline" className={colors[riskKey] ?? colors.medium}>
        {label}
      </Badge>
    );
  };

  const getDecisionBadge = (decision?: string | null) => {
    if (!decision) return <span className="text-muted-foreground">—</span>;

    const styles: Record<string, { color: string; label: string }> = {
      APPROVE: {
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Approved",
      },
      CONDITIONAL_APPROVE: {
        color: "bg-lime-100 text-lime-700 border-lime-200",
        label: "Conditional",
      },
      DECLINE: {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Declined",
      },
      FRAUD_HOLD: {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Fraud Hold",
      },
      REFER: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Referred",
      },
      // Legacy lowercase values
      approved: {
        color: "bg-green-100 text-green-700 border-green-200",
        label: "Approved",
      },
      declined: {
        color: "bg-red-100 text-red-700 border-red-200",
        label: "Declined",
      },
      referred: {
        color: "bg-yellow-100 text-yellow-700 border-yellow-200",
        label: "Referred",
      },
    };

    const config = styles[decision] || {
      color: "bg-muted text-muted-foreground",
      label: decision,
    };

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Headers must match the loaded `<TableHead>` titles below 1:1 so the
  // header doesn't reflow when data arrives. `isCompact` (used by the
  // dashboard's referral queue) drops the Date column.
  if (isLoading) {
    const headers = [
      "Request ID",
      "Applicant",
      "Status",
      "Score",
      "Risk",
      "Decision",
      ...(isCompact ? [] : ["Date"]),
      "",
    ];
    return <TableSkeleton headers={headers} rows={isCompact ? 5 : 8} />;
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Decision</TableHead>
              {!isCompact && <TableHead>Date</TableHead>}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableEmpty
                colSpan={isCompact ? 7 : 8}
                title="No score requests found"
                description="There are no score requests to display."
              />
            ) : (
              requests.map((request) => {
                const result = request.scoring_result;
                const scoringMeta = result?.scoring_metadata;
                const creditScore = scoringMeta?.credit_score;

                return (
                <TableRow key={request.id}>
                  <TableCell>
                    <Link
                      href={`${ROUTES.ORG.SCORE_REQUESTS}/${request.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {request.id}
                    </Link>
                    {request.referenceId && (
                      <p className="text-xs text-muted-foreground">
                        {request.referenceId}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.applicantName}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-center">
                    {creditScore != null ? (
                      <span className="font-semibold">{creditScore}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{getRiskBadge(request.riskCategory)}</TableCell>
                  <TableCell>{getDecisionBadge(request.decision)}</TableCell>
                  {!isCompact && (
                    <TableCell className="text-sm text-muted-foreground text-nowrap">
                      {formatDate(request.createdAt)}
                    </TableCell>
                  )}
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
                            href={`${ROUTES.ORG.SCORE_REQUESTS}/${request.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isCompact && onPageChange && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
        />
      )}
    </>
  );
}
