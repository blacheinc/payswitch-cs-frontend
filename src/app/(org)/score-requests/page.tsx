"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  UploadCloud,
  MoreHorizontal,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constant";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { scoreService, SCORE_KEYS } from "@/lib/score-service";
import { useDebounce } from "@/hooks/use-debounce";

// Mock data removed - now fetched from API

import { OrganizationScoreRequestsTable } from "@/components/score-requests/organization-score-requests-table";

export default function ScoreRequestsPage() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: SCORE_KEYS.list({ 
      page, 
      perPage, 
      search: debouncedSearch,
      status: statusFilter !== "all" ? statusFilter : undefined,
      risk: riskFilter !== "all" ? riskFilter : undefined,
    }),
    queryFn: () => scoreService.getScoreRequests({ 
      page, 
      perPage, 
      search: debouncedSearch,
      // Note: we might need to update scoreService to support status/risk if not already
    }),
  });

  const scoreRequests = data?.items || [];

  const toggleSelectAll = () => {
    if (selectedRows.length === scoreRequests.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(scoreRequests.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk`}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Bulk Request
            </Link>
          </Button>
          <Button asChild>
            <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
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
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="very_low">Very Low</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="very_high">Very High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Results</CardTitle>
              <CardDescription>
                {data?.total ?? 0} request
                {(data?.total ?? 0) !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            {selectedRows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows.length} selected
                </span>
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <OrganizationScoreRequestsTable 
            requests={scoreRequests}
            total={data?.total}
            page={page}
            totalPages={data?.totalPages}
            onPageChange={setPage}
            isLoading={isLoading}
            isError={isError}
            selectedRows={selectedRows}
            onSelectRow={toggleSelectRow}
            onSelectAll={toggleSelectAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}
