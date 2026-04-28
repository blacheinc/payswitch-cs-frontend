"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Gavel,
  ClipboardCheck,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, PERMISSION_CODES } from "@/lib/constant";
import {
  scoreService,
  SCORE_KEYS,
  type OverrideDecisionPayload,
  type RecordOutcomePayload,
  type RecordPerformancePayload,
} from "@/lib/score-service";
import {
  ScoreRequestDetailBody,
  getStatusBadge,
} from "@/components/score-requests/score-request-detail-body";
import { usePermissions } from "@/hooks/use-permissions";
import { NoPermission } from "@/components/shared/no-permission";

// =============================================================================
// Page
// =============================================================================

export default function ScoreRequestDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const requestId = params.id as string;

  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.SCORE_REQUESTS.READ);
  const canOverride = can(PERMISSION_CODES.SCORE_REQUESTS.OVERRIDE);
  const canRecordOutcome = can(PERMISSION_CODES.SCORE_REQUESTS.REPORT_OUTCOME);
  const canRecordPerformance = can(
    PERMISSION_CODES.SCORE_REQUESTS.REPORT_PERFORMANCE,
  );

  // ── Override Decision Modal state ──
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideTenure, setOverrideTenure] = useState("");
  const [overrideConditions, setOverrideConditions] = useState("");

  // ── Record Outcome Modal state ──
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [outcomeDecision, setOutcomeDecision] = useState<string>("");
  const [outcomeAmount, setOutcomeAmount] = useState("");
  const [outcomeTenure, setOutcomeTenure] = useState("");
  const [outcomeInterestRate, setOutcomeInterestRate] = useState("");
  const [outcomeDeclineReason, setOutcomeDeclineReason] = useState("");
  const [outcomeNotes, setOutcomeNotes] = useState("");

  // ── Record Performance Modal state ──
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [performanceStatus, setPerformanceStatus] = useState<string>("");
  const [performanceDaysPastDue, setPerformanceDaysPastDue] = useState("");
  const [performanceBalance, setPerformanceBalance] = useState("");
  const [performanceDate, setPerformanceDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // Queries
  // ═══════════════════════════════════════════════════════════════════════════

  const {
    data: scoreRequest,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: SCORE_KEYS.detail(requestId),
    queryFn: () => scoreService.getScoreRequestById(requestId),
    enabled: !!requestId && canRead,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Mutations
  // ═══════════════════════════════════════════════════════════════════════════

  const overrideMutation = useMutation({
    mutationFn: (payload: OverrideDecisionPayload) =>
      scoreService.overrideDecision(requestId, payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: SCORE_KEYS.detail(requestId) });
      setOverrideDialogOpen(false);
      resetOverrideForm();
      toast.success(data?.message || "Decision overridden successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to override decision");
    },
  });

  const outcomeMutation = useMutation({
    mutationFn: (payload: RecordOutcomePayload) =>
      scoreService.recordOutcome(requestId, payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: SCORE_KEYS.detail(requestId) });
      setOutcomeDialogOpen(false);
      resetOutcomeForm();
      toast.success(data?.message || "Outcome recorded successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to record outcome");
    },
  });

  const performanceMutation = useMutation({
    mutationFn: (payload: RecordPerformancePayload) =>
      scoreService.recordPerformance(requestId, payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: SCORE_KEYS.detail(requestId) });
      setPerformanceDialogOpen(false);
      resetPerformanceForm();
      toast.success(data?.message || "Performance data recorded");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to record performance data");
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const resetOverrideForm = () => {
    setOverrideDecision("");
    setOverrideReason("");
    setOverrideAmount("");
    setOverrideTenure("");
    setOverrideConditions("");
  };

  const resetOutcomeForm = () => {
    setOutcomeDecision("");
    setOutcomeAmount("");
    setOutcomeTenure("");
    setOutcomeInterestRate("");
    setOutcomeDeclineReason("");
    setOutcomeNotes("");
  };

  const resetPerformanceForm = () => {
    setPerformanceStatus("");
    setPerformanceDaysPastDue("");
    setPerformanceBalance("");
    setPerformanceDate(format(new Date(), "yyyy-MM-dd"));
  };

  const handleOverride = () => {
    overrideMutation.mutate({
      decision: overrideDecision as OverrideDecisionPayload["decision"],
      overrideReason,
      conditions: overrideConditions
        ? overrideConditions.split("\n").filter(Boolean)
        : null,
      approvedAmount: overrideAmount ? Number(overrideAmount) : null,
      approvedTenureMonths: overrideTenure ? Number(overrideTenure) : null,
    });
  };

  const handleRecordOutcome = () => {
    outcomeMutation.mutate({
      decision: outcomeDecision,
      approvedAmount: outcomeAmount ? Number(outcomeAmount) : null,
      approvedTenureMonths: outcomeTenure ? Number(outcomeTenure) : null,
      interestRate: outcomeInterestRate ? Number(outcomeInterestRate) : null,
      declineReason: outcomeDeclineReason || null,
      decisionNotes: outcomeNotes || null,
      decisionDate: null,
    });
  };

  const handleRecordPerformance = () => {
    performanceMutation.mutate({
      status: performanceStatus,
      daysPastDue: performanceDaysPastDue
        ? Number(performanceDaysPastDue)
        : null,
      outstandingBalance: performanceBalance
        ? Number(performanceBalance)
        : null,
      asOfDate: performanceDate,
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Loading / Error states
  // ═══════════════════════════════════════════════════════════════════════════

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={ROUTES.ORG.SCORE_REQUESTS}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Score Request</h1>
        </div>
        <NoPermission />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>

        {/* Body grid: 2-col main + 1-col sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <DetailCardSkeleton lines={5} />
            <DetailCardSkeleton lines={4} />
            <DetailCardSkeleton lines={3} />
          </div>
          <div className="space-y-6">
            <DetailCardSkeleton lines={4} />
            <DetailCardSkeleton lines={3} />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !scoreRequest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={ROUTES.ORG.SCORE_REQUESTS}>
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
              <Link href={ROUTES.ORG.SCORE_REQUESTS}>Back to list</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Header-only fields
  //
  // The full payload destructuring lives inside <ScoreRequestDetailBody/>.
  // The header only needs the request id, status, and reference id; all the
  // model breakdowns are rendered by the shared body.
  // ═══════════════════════════════════════════════════════════════════════════

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sr = scoreRequest as any;

  return (
    <div className="space-y-6">
      {/* ─── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={ROUTES.ORG.SCORE_REQUESTS}>
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
          {/* Refresh Data */}
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

          {/* Override Decision */}
          {canOverride && (
          <Dialog
            open={overrideDialogOpen}
            onOpenChange={(v) => {
              setOverrideDialogOpen(v);
              if (!v) resetOverrideForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Gavel className="mr-2 h-4 w-4" />
                Override
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Override Decision</DialogTitle>
                <DialogDescription>
                  Manually override this scoring decision. Only available when
                  the AI returned REFER or requires manual review.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Decision *</Label>
                  <Select
                    value={overrideDecision}
                    onValueChange={setOverrideDecision}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVE">Approve</SelectItem>
                      <SelectItem value="CONDITIONAL_APPROVE">
                        Conditional Approve
                      </SelectItem>
                      <SelectItem value="DECLINE">Decline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason *</Label>
                  <Textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Explain the reason for overriding the AI decision..."
                    rows={3}
                  />
                </div>
                {(overrideDecision === "APPROVE" ||
                  overrideDecision === "CONDITIONAL_APPROVE") && (
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label>Approved Amount (GHS)</Label>
                      <Input
                        type="number"
                        value={overrideAmount}
                        onChange={(e) => setOverrideAmount(e.target.value)}
                        placeholder="50000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tenure (months)</Label>
                      <Input
                        type="number"
                        value={overrideTenure}
                        onChange={(e) => setOverrideTenure(e.target.value)}
                        placeholder="24"
                      />
                    </div>
                  </div>
                )}
                {overrideDecision === "CONDITIONAL_APPROVE" && (
                  <div className="space-y-2">
                    <Label>Conditions (one per line)</Label>
                    <Textarea
                      value={overrideConditions}
                      onChange={(e) => setOverrideConditions(e.target.value)}
                      placeholder={
                        "Provide 3 months bank statements\nObtain guarantor for amounts > GHS 30,000"
                      }
                      rows={3}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOverrideDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleOverride}
                  disabled={
                    !overrideDecision ||
                    overrideReason.length < 5 ||
                    overrideMutation.isPending
                  }
                >
                  {overrideMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Override
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

          {/* Record Outcome */}
          {canRecordOutcome && (
          <Dialog
            open={outcomeDialogOpen}
            onOpenChange={(v) => {
              setOutcomeDialogOpen(v);
              if (!v) resetOutcomeForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Record Outcome
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Lending Outcome</DialogTitle>
                <DialogDescription>
                  Record the final lending decision. This data improves future
                  model accuracy.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Decision *</Label>
                  <Select
                    value={outcomeDecision}
                    onValueChange={setOutcomeDecision}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                      <SelectItem value="referred">
                        Referred for Review
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {outcomeDecision === "approved" && (
                  <>
                    <div className="grid gap-4 grid-cols-2">
                      <div className="space-y-2">
                        <Label>Approved Amount (GHS)</Label>
                        <Input
                          type="number"
                          value={outcomeAmount}
                          onChange={(e) => setOutcomeAmount(e.target.value)}
                          placeholder="50000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tenure (months)</Label>
                        <Input
                          type="number"
                          value={outcomeTenure}
                          onChange={(e) => setOutcomeTenure(e.target.value)}
                          placeholder="24"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Interest Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={outcomeInterestRate}
                        onChange={(e) => setOutcomeInterestRate(e.target.value)}
                        placeholder="25.5"
                      />
                    </div>
                  </>
                )}
                {outcomeDecision === "declined" && (
                  <div className="space-y-2">
                    <Label>Decline Reason</Label>
                    <Textarea
                      value={outcomeDeclineReason}
                      onChange={(e) => setOutcomeDeclineReason(e.target.value)}
                      placeholder="Reason for declining..."
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOutcomeDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordOutcome}
                  disabled={!outcomeDecision || outcomeMutation.isPending}
                >
                  {outcomeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Outcome
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}

          {/* Record Performance */}
          {canRecordPerformance && (
          <Dialog
            open={performanceDialogOpen}
            onOpenChange={(v) => {
              setPerformanceDialogOpen(v);
              if (!v) resetPerformanceForm();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Record Performance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Loan Performance</DialogTitle>
                <DialogDescription>
                  Report loan performance data for the model training feedback
                  loop.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select
                    value={performanceStatus}
                    onValueChange={setPerformanceStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="past_due_30">
                        Past Due 30 Days
                      </SelectItem>
                      <SelectItem value="past_due_60">
                        Past Due 60 Days
                      </SelectItem>
                      <SelectItem value="past_due_90">
                        Past Due 90 Days
                      </SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="paid_off">Paid Off</SelectItem>
                      <SelectItem value="write_off">Write Off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Days Past Due</Label>
                    <Input
                      type="number"
                      value={performanceDaysPastDue}
                      onChange={(e) =>
                        setPerformanceDaysPastDue(e.target.value)
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Outstanding Balance (GHS)</Label>
                    <Input
                      type="number"
                      value={performanceBalance}
                      onChange={(e) => setPerformanceBalance(e.target.value)}
                      placeholder="35000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>As Of Date *</Label>
                  <Input
                    type="date"
                    value={performanceDate}
                    onChange={(e) => setPerformanceDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPerformanceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordPerformance}
                  disabled={
                    !performanceStatus ||
                    !performanceDate ||
                    performanceMutation.isPending
                  }
                >
                  {performanceMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Performance
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>


      {/* All read-only model breakdowns + sidebar live in the shared body. */}
      <ScoreRequestDetailBody scoreRequest={scoreRequest} />
    </div>
  );
}

/** Skeleton placeholder for a generic Card with `lines` body rows. */
function DetailCardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Card header — icon + title + caption */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
        {/* Body — alternating wide/narrow rows */}
        <div className="space-y-2.5">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={i % 2 === 0 ? "h-3 w-full" : "h-3 w-3/4"}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
