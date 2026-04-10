"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarIcon,
  Loader2,
  Shield,
  Gavel,
  ClipboardCheck,
  BarChart3,
  ShieldAlert,
  Activity,
  Brain,
  Fingerprint,
  Wallet,
  BadgeCheck,
  User,
  CreditCard,
  Ban,
  ShieldOff,
  AlertOctagon,
  RefreshCw,
  FileQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constant";
import {
  scoreService,
  SCORE_KEYS,
  type OverrideDecisionPayload,
  type RecordOutcomePayload,
  type RecordPerformancePayload,
} from "@/lib/score-service";

// =============================================================================
// Helpers
// =============================================================================

const getDecisionConfig = (decision: string) => {
  const configs: Record<
    string,
    { color: string; bg: string; border: string; label: string }
  > = {
    APPROVE: {
      color: "text-green-700",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      label: "Approved",
    },
    CONDITIONAL_APPROVE: {
      color: "text-lime-700",
      bg: "bg-lime-50 dark:bg-lime-900/20",
      border: "border-lime-200 dark:border-lime-800",
      label: "Conditional Approve",
    },
    DECLINE: {
      color: "text-red-700",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      label: "Declined",
    },
    REFER: {
      color: "text-yellow-700",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      label: "Referred",
    },
    FRAUD_HOLD: {
      color: "text-red-700",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      label: "Fraud Hold",
    },
  };
  return (
    configs[decision] || {
      color: "text-muted-foreground",
      bg: "bg-muted/50",
      border: "border-muted",
      label: decision,
    }
  );
};

const getRiskTierConfig = (tier: string) => {
  const configs: Record<string, { color: string; progressColor: string }> = {
    VERY_LOW: { color: "text-green-600", progressColor: "bg-green-500" },
    LOW: { color: "text-lime-600", progressColor: "bg-lime-500" },
    MEDIUM: { color: "text-yellow-600", progressColor: "bg-yellow-500" },
    HIGH: { color: "text-orange-600", progressColor: "bg-orange-500" },
    VERY_HIGH: { color: "text-red-600", progressColor: "bg-red-500" },
  };
  return configs[tier] || configs.MEDIUM;
};

const getFraudFlagConfig = (flag: string) => {
  const configs: Record<
    string,
    {
      variant: "default" | "secondary" | "destructive" | "outline";
      label: string;
    }
  > = {
    LOW: { variant: "outline", label: "Low Risk" },
    MEDIUM: { variant: "secondary", label: "Medium Risk" },
    HIGH: { variant: "destructive", label: "High Risk" },
  };
  return configs[flag] || { variant: "outline", label: flag };
};

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    A: "text-green-600 bg-green-100",
    B: "text-lime-600 bg-lime-100",
    C: "text-yellow-600 bg-yellow-100",
    D: "text-orange-600 bg-orange-100",
    F: "text-red-600 bg-red-100",
  };
  return colors[grade] || colors.C;
};

const getImpactIcon = (impact: string) => {
  if (impact === "positive")
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (impact === "negative")
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const getSeverityBadge = (severity: string, impact: string) => {
  const isPositive = impact === "positive";
  const colors: Record<string, string> = {
    high: isPositive
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700",
    medium: isPositive
      ? "bg-lime-100 text-lime-700"
      : "bg-orange-100 text-orange-700",
    low: "bg-gray-100 text-gray-700",
  };
  return (
    <Badge variant="outline" className={colors[severity]}>
      {severity}
    </Badge>
  );
};

const getStatusBadge = (status: string) => {
  const config: Record<
    string,
    {
      icon: React.ReactNode;
      variant: "success" | "secondary" | "destructive" | "outline";
    }
  > = {
    completed: {
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      variant: "success",
    },
    scored: {
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      variant: "success",
    },
    processing: {
      icon: <Clock className="w-3 h-3 mr-1" />,
      variant: "secondary",
    },
    pending: {
      icon: <Clock className="w-3 h-3 mr-1" />,
      variant: "outline",
    },
    failed: {
      icon: <XCircle className="w-3 h-3 mr-1" />,
      variant: "destructive",
    },
    error: {
      icon: <XCircle className="w-3 h-3 mr-1" />,
      variant: "destructive",
    },
  };
  const c = config[status] || config.pending;
  return (
    <Badge variant={c.variant} className="capitalize">
      {c.icon}
      {status}
    </Badge>
  );
};

const fmtDate = (v?: string | null) => {
  if (!v) return "—";
  try {
    return format(new Date(v), "PPpp");
  } catch {
    return v;
  }
};

const fmtGHS = (v?: number | null) =>
  v != null
    ? `GHS ${v.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`
    : "—";

const fmtPercent = (v?: number | null) =>
  v != null ? `${(v * 100).toFixed(2)}%` : "—";

// =============================================================================
// Page
// =============================================================================

export default function ScoreRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestId = params.id as string;

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
    enabled: !!requestId,
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
  // Destructure API response
  // ═══════════════════════════════════════════════════════════════════════════

  const sr = scoreRequest as any;
  const timestamps = sr.timestamps;
  const scoreError = sr.error;

  // The main scoring data lives in scoring_result (inline in the response)
  const result = sr.scoring_result;
  const decision = result?.decision;
  const decisionConfig = decision ? getDecisionConfig(decision) : null;

  // Sub-models from scoring_result
  const creditRisk = result?.credit_risk;
  const fraudDetection = result?.fraud_detection;
  const loanAmount = result?.loan_amount;
  const incomeVerification = result?.income_verification;
  const scoringMeta = result?.scoring_metadata;
  const conditionsApplied: string[] = result?.condition_applied || [];
  const declineReasons: string[] = result?.decline_reasons || [];
  const triggeredRules: string[] = result?.triggered_rules || [];
  const errors: string[] = result?.errors || [];
  const shapContributions: any[] = creditRisk?.shap_contributions || [];
  const reasonCodes: string[] = creditRisk?.decision_reason_codes || [];

  // Applicant and loan request info
  const applicant = sr.applicant;
  const loanRequest = sr.loan_request;

  // Legacy fields (may be populated for older requests)
  const score = sr.score;
  const scoreComponents = sr.score_components;
  const riskFactors: any[] = sr.risk_factors || [];
  const recommendations: any[] = sr.recommendations || [];
  const affordability = sr.affordability;
  const modelInfo = sr.model_info;

  const hasMainContent =
    !!creditRisk ||
    !!fraudDetection ||
    !!score ||
    !!scoreComponents ||
    riskFactors.length > 0 ||
    recommendations.length > 0;

  // Derive score gauge values
  const creditScore = scoringMeta?.credit_score ?? score?.value;
  const scoreGrade = scoringMeta?.score_grade ?? null;
  const maxScoreValue = score?.max_value || 850;
  const minScoreValue = score?.min_value || 300;
  const riskTier = creditRisk?.risk_tier;
  const riskTierConfig = riskTier ? getRiskTierConfig(riskTier) : null;
  const scorePercentage =
    creditScore != null && maxScoreValue > minScoreValue
      ? ((creditScore - minScoreValue) / (maxScoreValue - minScoreValue)) * 100
      : 0;

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
          {/* <Dialog
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
          </Dialog> */}

          {/* Record Outcome */}
          {/* <Dialog
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
          </Dialog> */}

          {/* Record Performance */}
          {/* <Dialog
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
          </Dialog> */}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Error state */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {scoreError && (
        <Card className="border-destructive/30">
          <CardContent className="flex items-start gap-3 pt-6">
            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">
                Scoring Error: {scoreError.code}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {scoreError.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Decision Banner */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {decision && decisionConfig && (
        <Card
          className={cn("border-2", decisionConfig.border, decisionConfig.bg)}
        >
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  decision === "APPROVE"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : decision === "FRAUD_HOLD"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : decision === "DECLINE"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-yellow-100 dark:bg-yellow-900/30",
                )}
              >
                {decision === "APPROVE" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : decision === "FRAUD_HOLD" ? (
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                ) : decision === "DECLINE" ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Decision</p>
                <p className={cn("text-2xl font-bold", decisionConfig.color)}>
                  {decisionConfig.label}
                </p>
              </div>
            </div>

            {/* Credit score beside the decision */}
            {creditScore != null && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Credit Score</p>
                  <p className="text-4xl font-bold">{creditScore}</p>
                </div>
                {scoreGrade && (
                  <Badge
                    className={cn(
                      "text-lg px-3 py-1",
                      scoreGrade === "A"
                        ? "bg-green-100 text-green-800"
                        : scoreGrade === "B"
                          ? "bg-lime-100 text-lime-800"
                          : scoreGrade === "C"
                            ? "bg-yellow-100 text-yellow-800"
                            : scoreGrade === "D"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800",
                    )}
                  >
                    Grade {scoreGrade}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* Errors, Decline Reasons & Triggered Rules */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {(declineReasons.length > 0 ||
        triggeredRules.length > 0 ||
        errors.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {errors.length > 0 && (
            <Card className="border-red-300 dark:border-red-800 bg-red-100/50 dark:bg-red-900/20 lg:col-span-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-600" />
                  System Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {errors.map((errorText: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200 font-medium"
                    >
                      <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{errorText}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {declineReasons.length > 0 && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  Decline Reasons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {declineReasons.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {triggeredRules.length > 0 && (
            <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldOff className="h-5 w-5 text-orange-600" />
                  Triggered Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {triggeredRules.map((rule: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ═══════════════ Main content ═══════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ─── Credit Risk Model ──────────────────────────────────────── */}
          {creditRisk && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Credit Risk Assessment
                </CardTitle>
                <CardDescription>
                  Probability of default and risk tier from the credit risk
                  model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PD + Risk Tier summary */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Probability of Default
                    </p>
                    <p className="text-3xl font-bold">
                      {fmtPercent(creditRisk.probability_of_default)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      PD Confidence
                    </p>
                    <p className="text-3xl font-bold">
                      {fmtPercent(creditRisk.pd_confidence)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Risk Tier
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        riskTierConfig?.color,
                      )}
                    >
                      {riskTier?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                {/* SHAP Contributions */}
                {shapContributions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Key Risk Drivers (SHAP)
                    </h4>
                    <div className="space-y-3">
                      {shapContributions.map((shap: any, idx: number) => {
                        const isPositive = shap.direction === "positive";
                        const absValue = Math.abs(shap.value);
                        const maxShap = Math.max(
                          ...shapContributions.map((s: any) =>
                            Math.abs(s.value),
                          ),
                        );
                        const widthPct = (absValue / maxShap) * 100;

                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="capitalize font-medium">
                                {shap.feature.replace(/_/g, " ")}
                              </span>
                              <div className="flex items-center gap-2">
                                {isPositive ? (
                                  <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                                ) : (
                                  <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                                )}
                                <span
                                  className={cn(
                                    "font-mono text-xs font-semibold",
                                    isPositive
                                      ? "text-red-600"
                                      : "text-green-600",
                                  )}
                                >
                                  {isPositive ? "+" : ""}
                                  {shap.value.toFixed(4)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isPositive ? "bg-red-400" : "bg-green-400",
                                )}
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reason Codes */}
                {reasonCodes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Decision Reason Codes
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {reasonCodes.map((code: string) => (
                        <Badge
                          key={code}
                          variant="outline"
                          className="font-mono"
                        >
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Fraud Detection ────────────────────────────────────────── */}
          {fraudDetection && (
            <Card
              className={
                fraudDetection.fraud_risk_flag === "HIGH"
                  ? "border-red-200 dark:border-red-800"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  Fraud Detection
                </CardTitle>
                <CardDescription>
                  Anomaly detection model output
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {fraudDetection.fraud_anomaly_score != null && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Anomaly Score
                      </p>
                      <p className="text-3xl font-bold">
                        {(fraudDetection.fraud_anomaly_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {fraudDetection.fraud_probability != null && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Fraud Probability
                      </p>
                      <p className="text-3xl font-bold">
                        {fmtPercent(fraudDetection.fraud_probability)}
                      </p>
                    </div>
                  )}
                  {fraudDetection.fraud_risk_flag && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Risk Flag
                      </p>
                      <Badge
                        variant={
                          getFraudFlagConfig(fraudDetection.fraud_risk_flag)
                            .variant
                        }
                        className="text-sm mt-1"
                      >
                        {
                          getFraudFlagConfig(fraudDetection.fraud_risk_flag)
                            .label
                        }
                      </Badge>
                    </div>
                  )}
                </div>
                {fraudDetection.model_version && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Model version: {fraudDetection.model_version}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Loan Amount Assessment ────────────────────────────────── */}
          {loanAmount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Loan Amount Assessment
                </CardTitle>
                <CardDescription>
                  Recommended loan sizing from the loan amount model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {loanAmount.recommended_amount_ghs != null && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Recommended Amount
                      </p>
                      <p className="text-3xl font-bold">
                        {fmtGHS(loanAmount.recommended_amount_ghs)}
                      </p>
                    </div>
                  )}
                  {loanAmount.recommended_loan_tier && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Loan Tier
                      </p>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {loanAmount.recommended_loan_tier}
                      </Badge>
                    </div>
                  )}
                </div>
                {loanAmount.model_version && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Model version: {loanAmount.model_version}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Income Verification ───────────────────────────────────── */}
          {incomeVerification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  Income Verification
                </CardTitle>
                <CardDescription>
                  Estimated income tier and confidence from the income model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  {incomeVerification.income_tier != null && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Income Tier
                      </p>
                      <p className="text-3xl font-bold">
                        {incomeVerification.income_tier}
                      </p>
                    </div>
                  )}
                  {incomeVerification.income_tier_label && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Tier Label
                      </p>
                      <Badge variant="outline" className="text-sm mt-1">
                        {incomeVerification.income_tier_label.replace(
                          /_/g,
                          " ",
                        )}
                      </Badge>
                    </div>
                  )}
                  {incomeVerification.income_confidence != null && (
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Confidence
                      </p>
                      <p className="text-3xl font-bold">
                        {fmtPercent(incomeVerification.income_confidence)}
                      </p>
                    </div>
                  )}
                </div>
                {incomeVerification.model_version && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Model version: {incomeVerification.model_version}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Conditions Applied ─────────────────────────────────────── */}
          {conditionsApplied.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conditions Applied</CardTitle>
                <CardDescription>
                  Conditions that must be met before loan disbursement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {conditionsApplied.map((c: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* ─── Legacy: Score Components ────────────────────────────────── */}
          {scoreComponents &&
            Object.values(scoreComponents).some((v) => v != null) && (
              <Card>
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>How the score is calculated</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(scoreComponents)
                    .filter(([, v]) => v != null)
                    .map(([key, component]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/_/g, " ")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {component.score}/{component.max_score}
                            </span>
                            {component.grade && (
                              <Badge
                                className={cn(
                                  "w-6 h-6 justify-center",
                                  getGradeColor(component.grade),
                                )}
                              >
                                {component.grade}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress
                          value={(component.score / component.max_score) * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

          {/* ─── Legacy: Risk Factors ────────────────────────────────────── */}
          {riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskFactors.map((factor: any, idx: number) => (
                  <div
                    key={factor.code || idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="mt-0.5">{getImpactIcon(factor.impact)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {factor.description}
                        </span>
                        {getSeverityBadge(factor.severity, factor.impact)}
                      </div>
                      {factor.detail && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {factor.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ─── Legacy: Recommendations ─────────────────────────────────── */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    {rec.type === "approve" && (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    )}
                    {rec.type === "verify" && (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    )}
                    {rec.type === "condition" && (
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    {rec.type === "decline" && (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{rec.message}</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {rec.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ─── Empty State ───────────────────────────────────────────── */}
          {!hasMainContent && (
            <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-2 bg-muted/20">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                No Model Data Available
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Detailed assessment models were not generated for this request.
                This typically happens if the request failed, was declined
                before scoring, or encountered a data error.
              </p>
            </Card>
          )}
        </div>

        {/* ═══════════════ Sidebar ═══════════════ */}
        <div className="space-y-6">
          {/* Applicant Info */}
          {applicant && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Applicant
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {applicant.full_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-semibold">{applicant.full_name}</span>
                  </div>
                )}
                {applicant.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth</span>
                    <span className="font-semibold">
                      {fmtDate(applicant.date_of_birth)}
                    </span>
                  </div>
                )}
                {applicant.national_id_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">National ID</span>
                    <span className="font-mono text-xs">
                      {applicant.national_id_number}
                    </span>
                  </div>
                )}
                {applicant.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-semibold">{applicant.phone}</span>
                  </div>
                )}
                {applicant.account_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account No.</span>
                    <span className="font-mono text-xs">
                      {applicant.account_number}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loan Request */}
          {loanRequest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Loan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {loanRequest.amount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Requested Amount
                    </span>
                    <span className="font-semibold">
                      {fmtGHS(loanRequest.amount)}
                    </span>
                  </div>
                )}
                {loanRequest.tenure_months != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tenure</span>
                    <span className="font-semibold">
                      {loanRequest.tenure_months} months
                    </span>
                  </div>
                )}
                {loanRequest.purpose && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose</span>
                    <Badge variant="outline" className="capitalize">
                      {loanRequest.purpose}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scoring Metadata */}
          {scoringMeta && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Scoring Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {scoringMeta.credit_score != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Score</span>
                    <span className="font-semibold">
                      {scoringMeta.credit_score}
                    </span>
                  </div>
                )}
                {scoringMeta.score_grade && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score Grade</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        scoreGrade === "A"
                          ? "text-green-600"
                          : scoreGrade === "B"
                            ? "text-lime-600"
                            : "text-yellow-600",
                      )}
                    >
                      {scoringMeta.score_grade}
                    </Badge>
                  </div>
                )}
                {scoringMeta.data_quality_score != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Quality</span>
                    <span className="font-semibold">
                      {(scoringMeta.data_quality_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {scoringMeta.bureau_hit_status && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bureau Status</span>
                    <Badge variant="outline" className="text-xs">
                      {scoringMeta.bureau_hit_status}
                    </Badge>
                  </div>
                )}
                {scoringMeta.product_source && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Product Source
                    </span>
                    <span className="font-mono text-xs">
                      {scoringMeta.product_source}
                    </span>
                  </div>
                )}
                {scoringMeta.applicant_age_at_application != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applicant Age</span>
                    <span className="font-semibold">
                      {scoringMeta.applicant_age_at_application}
                    </span>
                  </div>
                )}
                {scoringMeta.credit_age_months_at_application != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Credit Age (months)
                    </span>
                    <span className="font-semibold">
                      {scoringMeta.credit_age_months_at_application}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Legacy affordability */}
          {affordability && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Affordability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {affordability.estimated_monthly_payment != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Est. Monthly Payment
                    </span>
                    <span className="font-semibold">
                      {fmtGHS(affordability.estimated_monthly_payment)}
                    </span>
                  </div>
                )}
                {affordability.debt_to_income_current != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current DTI</span>
                    <span className="font-semibold">
                      {Math.round(affordability.debt_to_income_current * 100)}%
                    </span>
                  </div>
                )}
                {affordability.max_recommended_amount != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Max Recommended
                    </span>
                    <span className="font-semibold">
                      {fmtGHS(affordability.max_recommended_amount)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {timestamps && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Requested</p>
                  <p className="font-medium">
                    {fmtDate(timestamps.requested_at)}
                  </p>
                </div>
                {timestamps.scored_at && (
                  <div>
                    <p className="text-muted-foreground">Scored</p>
                    <p className="font-medium">
                      {fmtDate(timestamps.scored_at)}
                    </p>
                  </div>
                )}
                {result?.scoring_timestamp && (
                  <div>
                    <p className="text-muted-foreground">Scoring Timestamp</p>
                    <p className="font-medium">
                      {fmtDate(result.scoring_timestamp)}
                    </p>
                  </div>
                )}
                {timestamps.valid_until && (
                  <div>
                    <p className="text-muted-foreground">Valid Until</p>
                    <p className="font-medium">
                      {fmtDate(timestamps.valid_until)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Model Versions */}
          {(creditRisk?.model_version ||
            fraudDetection?.model_version ||
            loanAmount?.model_version ||
            incomeVerification?.model_version ||
            modelInfo) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Model Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {creditRisk?.model_version && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Credit Risk Model
                    </span>
                    <span className="font-mono text-xs">
                      v{creditRisk.model_version}
                    </span>
                  </div>
                )}
                {fraudDetection?.model_version && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fraud Model</span>
                    <span className="font-mono text-xs">
                      v{fraudDetection.model_version}
                    </span>
                  </div>
                )}
                {loanAmount?.model_version && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Loan Amount Model
                    </span>
                    <span className="font-mono text-xs">
                      v{loanAmount.model_version}
                    </span>
                  </div>
                )}
                {incomeVerification?.model_version && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Income Model</span>
                    <span className="font-mono text-xs">
                      v{incomeVerification.model_version}
                    </span>
                  </div>
                )}
                {modelInfo?.model_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{modelInfo.model_type}</span>
                  </div>
                )}
                {modelInfo?.features_used && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Features Used</span>
                    <span className="font-medium">
                      {modelInfo.features_used}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
