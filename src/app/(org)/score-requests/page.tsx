"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, UploadCloud } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ROUTES, PERMISSION_CODES } from "@/lib/constant";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scoreService, SCORE_KEYS } from "@/lib/score-service";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermissions } from "@/hooks/use-permissions";
import { OrganizationScoreRequestsTable } from "@/components/score-requests/organization-score-requests-table";
import { NoPermission } from "@/components/shared/no-permission";

export default function ScoreRequestsPage() {
  const { can } = usePermissions();
  const canList = can(PERMISSION_CODES.SCORE_REQUESTS.LIST);
  const canBulkList = can(PERMISSION_CODES.BATCH_SCORING.LIST);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [decisionFilter, setDecisionFilter] = useState<string>("all");

  const debouncedSearch = useDebounce(searchQuery);

  const listParams = {
    page,
    perPage,
    search: debouncedSearch,
    status: statusFilter !== "all" ? statusFilter : undefined,
    decision: decisionFilter !== "all" ? decisionFilter : undefined,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: SCORE_KEYS.list(listParams),
    queryFn: () => scoreService.getScoreRequests(listParams),
    enabled: canList,
  });

  const scoreRequests = data?.items || [];

  if (!canList) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            View and manage credit score requests
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            View and manage credit score requests
          </p>
        </div>
        <div className="flex gap-2">
          {canBulkList && (
            <Button variant="outline" asChild>
              <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk`}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Bulk Request
              </Link>
            </Button>
          )}
          {can(PERMISSION_CODES.SCORE_REQUESTS.CREATE) && (
            <Button asChild>
              <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={decisionFilter} onValueChange={setDecisionFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="APPROVE">Approved</SelectItem>
                <SelectItem value="CONDITIONAL_APPROVE">
                  Conditionally Approved
                </SelectItem>
                <SelectItem value="REFER">Referred</SelectItem>
                <SelectItem value="DECLINE">Declined</SelectItem>
                <SelectItem value="FRAUD_HOLD">Fraud Hold</SelectItem>
                <SelectItem value="ERROR">Could Not Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Results</CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="inline-block h-4 w-32 align-middle" />
            ) : (
              <>
                {data?.total ?? 0} request
                {(data?.total ?? 0) !== 1 ? "s" : ""} found
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationScoreRequestsTable
            requests={scoreRequests}
            total={data?.total}
            page={page}
            totalPages={data?.totalPages}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
            isLoading={isLoading}
            isError={isError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
