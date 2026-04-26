"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constant";
import { scoreService, SCORE_KEYS } from "@/lib/score-service";
import {
  ScoreRequestDetailBody,
  getStatusBadge,
} from "@/components/score-requests/score-request-detail-body";

/**
 * Admin-side score-request detail.
 *
 * Same read-only payload as the org page (`ScoreRequestDetailBody`), but no
 * override / outcome / performance actions — admins read across orgs without
 * mutating customer-owned state. See the admin cross-org reads guide.
 */
export default function AdminScoreRequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;

  const {
    data: scoreRequest,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: SCORE_KEYS.detail(requestId),
    queryFn: () => scoreService.getScoreRequestById(requestId),
    enabled: !!requestId,
  });

  // ───────────── Loading ─────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ───────────── Error / not-found ─────────────
  if (isError || !scoreRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={ROUTES.ADMIN.SCORE_REQUESTS}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Score Request</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Failed to load score request
            </h2>
            <p className="text-muted-foreground text-sm">
              The score request could not be found or there was an error loading
              it.
            </p>
            <Button variant="outline" asChild>
              <Link href={ROUTES.ADMIN.SCORE_REQUESTS}>Back to list</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sr = scoreRequest as any;

  return (
    <div className="space-y-6">
      {/* ─── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={ROUTES.ADMIN.SCORE_REQUESTS}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold font-mono">{sr.request_id}</h1>
              {getStatusBadge(sr.status)}
            </div>
            {sr.reference_id && (
              <p className="text-muted-foreground text-sm">
                Ref: {sr.reference_id}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* All read-only model breakdowns + sidebar live in the shared body. */}
      <ScoreRequestDetailBody scoreRequest={scoreRequest} />
    </div>
  );
}
