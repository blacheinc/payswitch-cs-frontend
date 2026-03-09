"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Activity, CheckCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { scoreService, SCORE_KEYS } from "@/lib/score-service";
import { AdminScoreRequestsTable } from "@/components/admin/admin-score-requests-table";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminScoreRequestsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: SCORE_KEYS.list({ page, perPage: 10, search: debouncedSearch }),
    queryFn: () =>
      scoreService.getScoreRequests({
        page,
        perPage: 10,
        search: debouncedSearch,
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Score Requests</h1>
          <p className="text-muted-foreground">
            Platform-wide credit score requests overview
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.items && data.items.some((r) => r.scoreValue)
                ? Math.round(
                    data.items.reduce(
                      (acc, r) => acc + (r.scoreValue || 0),
                      0,
                    ) / data.items.filter((r) => r.scoreValue).length,
                  )
                : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.items
                ? data.items.filter((r) => r.status === "completed").length
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Score Requests</CardTitle>
              <CardDescription>
                Credit score evaluations submitted by registered organizations.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdminScoreRequestsTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
