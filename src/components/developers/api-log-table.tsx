"use client";

import { Loader2 } from "lucide-react";

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
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { ApiLogEntry } from "@/lib/developer-service";
import type { PaginatedResponse } from "@/types/api-type";
import { formatDate } from "@/lib/utils";

interface ApiLogTableProps {
  data: PaginatedResponse<ApiLogEntry> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "text-green-600 border-green-200 bg-green-50",
  POST: "text-blue-600 border-blue-200 bg-blue-50",
  PUT: "text-yellow-600 border-yellow-200 bg-yellow-50",
  PATCH: "text-orange-600 border-orange-200 bg-orange-50",
  DELETE: "text-red-600 border-red-200 bg-red-50",
};

export function ApiLogTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
}: ApiLogTableProps) {
  const logs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300)
      return <Badge variant="success">{code}</Badge>;
    if (code >= 400 && code < 500)
      return <Badge variant="warning">{code}</Badge>;
    if (code >= 500) return <Badge variant="destructive">{code}</Badge>;
    return <Badge variant="secondary">{code}</Badge>;
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
        Failed to load API logs. Please try again.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Latency</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title="No API logs found"
              description="There are no API logs matching your filters."
            />
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={METHOD_COLORS[log.method] || "text-gray-600"}
                  >
                    {log.method}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-mono max-w-[260px] truncate">
                  {log.path}
                </TableCell>
                <TableCell>
                  {log.errorMessage ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {getStatusBadge(log.statusCode)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{log.errorMessage}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    getStatusBadge(log.statusCode)
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.responseTimeMs}ms
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.apiKeyPrefix || "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(log.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={onPageChange}
      />
    </>
  );
}
