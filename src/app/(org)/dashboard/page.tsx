"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Layers,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UploadCloud,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ROUTES, PERMISSION_CODES } from "@/lib/constant";
import {
  scoreService,
  SCORE_KEYS,
  BATCH_KEYS,
  type ScoreDashboardPeriod,
  type StatsDecisionCounts,
  type ScoreDistributionBucket,
} from "@/lib/score-service";
import { formatNumber, formatPct } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { authService } from "@/lib/auth-service";
import { usePermissions } from "@/hooks/use-permissions";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { OrganizationScoreRequestsTable } from "@/components/score-requests/organization-score-requests-table";

const ACTIVE_BATCH_STATUSES = new Set(["queued", "processing"]);
const REFERRAL_QUEUE_SIZE = 6;

const PERIOD_OPTIONS: {
  value: ScoreDashboardPeriod;
  label: string;
  short: string;
}[] = [
  { value: "today", label: "Today", short: "today" },
  { value: "7d", label: "Last 7 days", short: "last 7 days" },
  { value: "30d", label: "Last 30 days", short: "last 30 days" },
  { value: "90d", label: "Last 90 days", short: "last 90 days" },
];

function firstName(fullName?: string | null): string {
  if (!fullName) return "there";
  return fullName.trim().split(/\s+/)[0] ?? "there";
}

export default function DashboardPage() {
  const { organization } = useAuth();
  const { can } = usePermissions();

  const [period, setPeriod] = useState<ScoreDashboardPeriod>("7d");

  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.getMe(),
  });

  // KPI aggregates fetched server-side.
  const statsQuery = useQuery({
    queryKey: SCORE_KEYS.stats(period),
    queryFn: () => scoreService.getScoreRequestsStats(period),
    refetchInterval: period === "today" ? 60_000 : 5 * 60_000,
    staleTime: period === "today" ? 30_000 : 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  // Referral queue — backend filters by `decision=REFER`.
  const referralQueueQuery = useQuery({
    queryKey: SCORE_KEYS.list({
      page: 1,
      perPage: REFERRAL_QUEUE_SIZE,
      decision: "REFER",
    }),
    queryFn: () =>
      scoreService.getScoreRequests({
        page: 1,
        perPage: REFERRAL_QUEUE_SIZE,
        decision: "REFER",
      }),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const canListBatches = can(PERMISSION_CODES.BATCH_SCORING.LIST);

  const batchQuery = useQuery({
    queryKey: BATCH_KEYS.list({ page: 1, pageSize: 10 }),
    queryFn: () => scoreService.listBatchJobs({ page: 1, pageSize: 10 }),
    enabled: canListBatches,
    refetchInterval: 10_000,
  });

  const stats = statsQuery.data;

  const activeBatches = useMemo(
    () =>
      (batchQuery.data?.items ?? []).filter((j) =>
        ACTIVE_BATCH_STATUSES.has(j.status),
      ),
    [batchQuery.data?.items],
  );

  const reviewQueue = referralQueueQuery.data?.items ?? [];

  const welcomeName = profileQuery.data?.name
    ? firstName(profileQuery.data.name)
    : "there";

  const loading = statsQuery.isLoading;
  const canCreate = can(PERMISSION_CODES.SCORE_REQUESTS.CREATE);
  const periodShort =
    PERIOD_OPTIONS.find((o) => o.value === period)?.short ?? period;

  return (
    <div className="space-y-6">
      {/* 1. Hero */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">
            Welcome back, {welcomeName} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            {organization?.name
              ? `Here's what's happening at ${organization.name}.`
              : "Here's a quick look at your scoring activity."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk`}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Bulk request
            </Link>
          </Button>
          {canCreate && (
            <Button asChild>
              <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                New score request
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Active batch jobs (conditional) */}
      {activeBatches.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">
                  {activeBatches.length} batch job
                  {activeBatches.length === 1 ? "" : "s"} in progress
                </CardTitle>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk`}>
                  View all
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {activeBatches.slice(0, 3).map((job) => {
              const done = job.completed + job.failed;
              const pct = job.total > 0 ? (done / job.total) * 100 : 0;
              return (
                <Link
                  key={job.jobId}
                  href={`${ROUTES.ORG.SCORE_REQUESTS}/bulk/${job.jobId}`}
                  className="block rounded-md border bg-background/50 px-3 py-2 hover:bg-background"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {job.status === "processing" ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">
                          ◷
                        </span>
                      )}
                      <span className="font-mono text-xs truncate">
                        {job.jobId}
                      </span>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {job.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {done} / {job.total}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 3. KPIs with period filter */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">At a glance</h2>
            <p className="text-xs text-muted-foreground">
              Comparison is against the previous {periodShort}.
            </p>
          </div>
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as ScoreDashboardPeriod)}
          >
            <SelectTrigger className="w-36 sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {loading || !stats ? (
            <>
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
              <KpiSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label={`Requests · ${periodShort}`}
                value={formatNumber(stats.current.total_requests)}
                icon={<Sparkles className="h-4 w-4 text-primary" />}
                description={
                  stats.trend.total_delta_pct != null ? (
                    <TrendPill
                      delta={stats.trend.total_delta_pct}
                      suffix="%"
                    />
                  ) : (
                    `${formatNumber(stats.previous.total_requests)} previous`
                  )
                }
              />
              <StatCard
                label="Approval rate"
                value={
                  stats.current.decided > 0
                    ? formatPct(stats.current.approval_rate_pct, 1)
                    : "—"
                }
                icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                description={
                  stats.trend.approval_delta_pp != null ? (
                    <TrendPill
                      delta={stats.trend.approval_delta_pp}
                      suffix="pp"
                      digits={1}
                    />
                  ) : stats.current.decided > 0 ? (
                    `across ${stats.current.decided} decisions`
                  ) : (
                    "no decisions yet"
                  )
                }
                tone={stats.current.decided > 0 ? "success" : "default"}
              />
              <StatCard
                label="Average credit score"
                value={stats.current.avg_credit_score ?? "—"}
                icon={<BarChart3 className="h-4 w-4 text-primary" />}
                description={
                  stats.trend.score_delta != null ? (
                    <TrendPill
                      delta={stats.trend.score_delta}
                      suffix=""
                      digits={0}
                      invertTone={false}
                    />
                  ) : stats.current.median_credit_score != null ? (
                    `median ${stats.current.median_credit_score}`
                  ) : (
                    "no scored requests"
                  )
                }
              />
              <StatCard
                label="Needs your review"
                value={formatNumber(
                  stats.needs_attention.referred +
                    stats.needs_attention.pending_or_processing +
                    stats.needs_attention.failed,
                )}
                icon={
                  <ShieldCheck
                    className={`h-4 w-4 ${
                      stats.needs_attention.referred +
                        stats.needs_attention.pending_or_processing +
                        stats.needs_attention.failed >
                      0
                        ? "text-yellow-500"
                        : "text-green-500"
                    }`}
                  />
                }
                description={`${stats.needs_attention.referred} referred · ${stats.needs_attention.pending_or_processing} in flight · ${stats.needs_attention.failed} failed`}
                tone={
                  stats.needs_attention.referred +
                    stats.needs_attention.pending_or_processing +
                    stats.needs_attention.failed >
                  0
                    ? "warning"
                    : "success"
                }
              />
            </>
          )}
        </div>
      </div>

      {/* 4. Outcomes + score spread */}
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Outcome breakdown</CardTitle>
            <CardDescription>
              {stats && stats.current.decided > 0
                ? `How ${stats.current.decided} applications resolved ${periodShort}`
                : `No decisions ${periodShort}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !stats ? (
              <Skeleton className="h-32 w-full" />
            ) : stats.current.decided === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title={`Nothing scored ${periodShort}`}
                description="Submit a score request or widen the time window to see outcomes here."
                action={
                  canCreate ? (
                    <Button size="sm" asChild>
                      <Link href={`${ROUTES.ORG.SCORE_REQUESTS}/new`}>
                        <Plus className="mr-2 h-4 w-4" />
                        New score request
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <OutcomeBar
                counts={stats.current.decision_counts}
                total={stats.current.decided}
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Credit score spread</CardTitle>
            <CardDescription>
              Applicants scored {periodShort}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !stats ? (
              <Skeleton className="h-32 w-full" />
            ) : stats.current.score_distribution.every((b) => b.count === 0) ? (
              <EmptyState
                icon={<BarChart3 className="h-8 w-8" />}
                title={`No scored applicants ${periodShort}`}
                description="Once applications are scored in this window, the spread across credit-score bands will appear here."
              />
            ) : (
              <ScoreHistogram buckets={stats.current.score_distribution} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Your queue — server-filtered to decision=REFER */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Your queue</CardTitle>
            <CardDescription>
              Applications referred for manual review.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.ORG.SCORE_REQUESTS}>
              View all score requests
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {referralQueueQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : reviewQueue.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8" />}
              title="Nothing needs your attention"
              description="When an application is referred for manual review, it'll show up here."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href={ROUTES.ORG.SCORE_REQUESTS}>
                    See recent activity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          ) : (
            <OrganizationScoreRequestsTable
              requests={reviewQueue}
              isLoading={false}
              isError={referralQueueQuery.isError}
              isCompact
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendPill({
  delta,
  suffix,
  digits = 1,
  invertTone,
}: {
  delta: number;
  suffix: string;
  digits?: number;
  /** For metrics where lower is better (not used currently). */
  invertTone?: boolean;
}) {
  const positive = delta > 0;
  const negative = delta < 0;
  const good = invertTone ? negative : positive;
  const bad = invertTone ? positive : negative;
  const tone = good
    ? "text-green-600"
    : bad
      ? "text-red-600"
      : "text-muted-foreground";
  const Icon = positive
    ? TrendingUp
    : negative
      ? TrendingDown
      : ArrowRight;
  const sign = positive ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {sign}
      {delta.toFixed(digits)}
      {suffix}
      <span className="font-normal text-muted-foreground">vs previous</span>
    </span>
  );
}

function OutcomeBar({
  counts,
  total,
}: {
  counts: StatsDecisionCounts;
  total: number;
}) {
  const rows = [
    {
      key: "APPROVE",
      label: "Approved",
      count: counts.APPROVE,
      color: "bg-green-500",
      tone: "text-green-600",
    },
    {
      key: "CONDITIONAL_APPROVE",
      label: "Approved with conditions",
      count: counts.CONDITIONAL_APPROVE,
      color: "bg-lime-500",
      tone: "text-lime-600",
    },
    {
      key: "REFER",
      label: "Referred",
      count: counts.REFER,
      color: "bg-yellow-500",
      tone: "text-yellow-600",
    },
    {
      key: "DECLINE",
      label: "Declined",
      count: counts.DECLINE,
      color: "bg-red-500",
      tone: "text-red-600",
    },
    {
      key: "ERROR",
      label: "Could not score",
      count: counts.ERROR,
      color: "bg-muted-foreground/40",
      tone: "text-muted-foreground",
    },
    ...(counts.FRAUD_HOLD > 0
      ? [
          {
            key: "FRAUD_HOLD",
            label: "Fraud hold",
            count: counts.FRAUD_HOLD,
            color: "bg-purple-500",
            tone: "text-purple-600",
          },
        ]
      : []),
  ].filter((r) => r.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex h-2.5 rounded-full overflow-hidden bg-muted">
        {rows.map((r) => (
          <div
            key={r.key}
            className={r.color}
            style={{ width: `${(r.count / total) * 100}%` }}
            title={`${r.label}: ${r.count}`}
          />
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2 h-2 rounded-full ${r.color}`} />
              <span className="text-sm truncate">{r.label}</span>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-semibold ${r.tone}`}>
                {formatNumber(r.count)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPct((r.count / total) * 100, 0)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreHistogram({
  buckets,
}: {
  buckets: ScoreDistributionBucket[];
}) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-40">
      {buckets.map((b, idx) => {
        const pct = (b.count / max) * 100;
        const tone =
          idx < 2 ? "bg-red-400" : idx < 3 ? "bg-yellow-400" : "bg-green-500";
        return (
          <div
            key={b.range}
            className="flex-1 flex flex-col items-center gap-1 min-w-0"
          >
            <div
              className={`w-full rounded-t ${tone}`}
              style={{
                height: `${pct}%`,
                minHeight: b.count > 0 ? 4 : 0,
              }}
              title={`${b.range}: ${b.count}`}
            />
            <span className="text-[10px] text-muted-foreground font-mono truncate w-full text-center">
              {b.range}
            </span>
            <span className="text-[10px] font-semibold">{b.count}</span>
          </div>
        );
      })}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16 mt-3" />
        <Skeleton className="h-3 w-32 mt-2" />
      </CardContent>
    </Card>
  );
}
