"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCcw,
  UserCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { monitoringService, MONITORING_KEYS } from "@/lib/monitoring-service";
import { formatDate } from "@/lib/utils";
import type { PlatformApiLogFilters } from "@/types/monitoring-types";

const METHOD_OPTIONS = [
  { value: "all", label: "All methods" },
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PUT", label: "PUT" },
  { value: "PATCH", label: "PATCH" },
  { value: "DELETE", label: "DELETE" },
];

const STATUS_CLASS_OPTIONS = [
  { value: "all", label: "All responses" },
  { value: "2xx", label: "Successful (2xx)" },
  { value: "3xx", label: "Redirects (3xx)" },
  { value: "4xx", label: "Client errors (4xx)" },
  { value: "5xx", label: "Server errors (5xx)" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-600 border-green-200 bg-green-50",
  POST: "text-blue-600 border-blue-200 bg-blue-50",
  PUT: "text-yellow-600 border-yellow-200 bg-yellow-50",
  PATCH: "text-orange-600 border-orange-200 bg-orange-50",
  DELETE: "text-red-600 border-red-200 bg-red-50",
};

function statusBadge(code: number) {
  if (code >= 200 && code < 300) return <Badge variant="success">{code}</Badge>;
  if (code >= 400 && code < 500) return <Badge variant="warning">{code}</Badge>;
  if (code >= 500) return <Badge variant="destructive">{code}</Badge>;
  return <Badge variant="secondary">{code}</Badge>;
}

function initials(actorName?: string | null) {
  if (!actorName) return "?";
  return actorName
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

export function ActivityTab() {
  const [page, setPage] = useState(1);
  const [method, setMethod] = useState<string>("all");
  const [statusClass, setStatusClass] = useState<string>("all");
  const [pathDraft, setPathDraft] = useState("");
  const [path, setPath] = useState<string | undefined>(undefined);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const filters: PlatformApiLogFilters = {
    page,
    perPage: 20,
    method: method === "all" ? undefined : method,
    statusClass:
      statusClass === "all"
        ? undefined
        : (statusClass as PlatformApiLogFilters["statusClass"]),
    path: path || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: MONITORING_KEYS.platformLogs(filters),
    queryFn: () => monitoringService.getPlatformApiLogs(filters),
  });

  const logs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const resetFilters = () => {
    setMethod("all");
    setStatusClass("all");
    setPath(undefined);
    setPathDraft("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter admin activity</CardTitle>
          <CardDescription>
            Review requests made by admin users. Filter by action type,
            response, URL, or date range.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              value={method}
              onValueChange={(v) => {
                setMethod(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusClass}
              onValueChange={(v) => {
                setStatusClass(v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Response" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_CLASS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              placeholder="From"
              aria-label="From date"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              placeholder="To"
              aria-label="To date"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mt-3">
            <Input
              placeholder="Search by URL (e.g. /admin/organizations)"
              value={pathDraft}
              onChange={(e) => setPathDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPath(pathDraft.trim() || undefined);
                  setPage(1);
                }
              }}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setPath(pathDraft.trim() || undefined);
                  setPage(1);
                }}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Search</span>
              </Button>
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="shrink-0"
              >
                Reset
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Admin activity log</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading entries…"
              : `${total.toLocaleString()} entr${total === 1 ? "y" : "ies"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                Failed to load activity log. Please try again.
              </p>
            </div>
          ) : (
            <TooltipProvider delayDuration={200}>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="min-w-[240px]">Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableEmpty
                        colSpan={6}
                        title="No activity found"
                        description="No admin requests match the current filters."
                      />
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {log.actor ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                                  {initials(log.actor.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {log.actor.name ?? "Unknown admin"}
                                  </p>
                                  {log.actor.email && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {log.actor.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                <UserCircle2 className="h-4 w-4" />
                                Unknown
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                METHOD_COLORS[log.method] ?? "text-gray-600"
                              }
                            >
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[320px] truncate">
                            {log.path}
                          </TableCell>
                          <TableCell>
                            {log.errorMessage ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {statusBadge(log.statusCode)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p className="text-xs">{log.errorMessage}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              statusBadge(log.statusCode)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-muted-foreground">
                            {log.responseTimeMs != null
                              ? `${Math.round(log.responseTimeMs)}ms`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
