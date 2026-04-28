"use client";

import Link from "next/link";
import { CheckCircle, Clock, XCircle } from "lucide-react";

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

import type { ScoreRequest } from "@/types/models";
import type { PaginatedResponse } from "@/types/api-type";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constant";

interface AdminScoreRequestsTableProps {
  data: PaginatedResponse<ScoreRequest> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

export function AdminScoreRequestsTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
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

    const styles: Record<string, { color: string; label: string }> = {
      APPROVE: { color: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
      CONDITIONAL_APPROVE: { color: "bg-lime-100 text-lime-700 border-lime-200", label: "Conditional" },
      DECLINE: { color: "bg-red-100 text-red-700 border-red-200", label: "Declined" },
      FRAUD_HOLD: { color: "bg-red-100 text-red-700 border-red-200", label: "Fraud Hold" },
      REFER: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Referred" },
      approved: { color: "bg-green-100 text-green-700 border-green-200", label: "Approved" },
      declined: { color: "bg-red-100 text-red-700 border-red-200", label: "Declined" },
      referred: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "Referred" },
    };

    const config = styles[decision] || { color: "bg-muted text-muted-foreground", label: decision };

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <TableSkeleton
        bordered={false}
        headers={[
          "Request ID",
          "Applicant",
          "Organisation",
          "Status",
          "Score",
          "Risk",
          "Decision",
          "Date",
        ]}
      />
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
            <TableHead>Organisation</TableHead>
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
            requests.map((request) => {
              const result = request.scoring_result;
              const scoringMeta = result?.scoring_metadata;
              const creditScore = scoringMeta?.credit_score;

              return (
              <TableRow key={request.id}>
                <TableCell>
                  <Link
                    href={`${ROUTES.ADMIN.SCORE_REQUESTS}/${request.id}`}
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
                <TableCell>
                  {request.organization ? (
                    <Link
                      href={`${ROUTES.ADMIN.ORGANIZATIONS}/${request.organization.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {request.organization.name}
                    </Link>
                  ) : (
                    // Fallback when the row arrives without an embedded org.
                    <span className="text-xs text-muted-foreground font-mono">
                      {request.organizationId}
                    </span>
                  )}
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
                <TableCell>
                  {getDecisionBadge(request.decision)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(request.createdAt)}
                </TableCell>
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={onPageChange}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
      />
    </>
  );
}
