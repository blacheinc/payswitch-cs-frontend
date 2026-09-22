"use client";

import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Activity,
  BadgeCheck,
  Ban,
  Brain,
  CalendarIcon,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  FileQuestion,
  Fingerprint,
  Loader2,
  Minus,
  ShieldAlert,
  ShieldOff,
  Shield,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { scoreService, type ApplicantPii } from "@/lib/score-service";

// =============================================================================
// Helpers — exported so page-level headers can render a matching status badge
// =============================================================================

export function getStatusBadge(status: string) {
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
}

// =============================================================================
// Internal helpers — only used inside the body
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

/**
 * Identity fields arrive masked; we render them as-is. Revealing hits an
 * audit-logged endpoint, hence one control for all three fields, click-only,
 * and cached after the first fetch so toggling doesn't re-log.
 */
function useApplicantReveal(requestId: string | undefined) {
  const [revealed, setRevealed] = useState(false);
  const [pii, setPii] = useState<ApplicantPii | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    if (revealed) {
      setRevealed(false);
      return;
    }
    // Already fetched — re-show without another audited call.
    if (pii) {
      setRevealed(true);
      return;
    }
    if (!requestId) {
      toast.error("Cannot reveal — this record has no request ID.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await scoreService.getApplicantPii(requestId);
      setPii(result);
      setRevealed(true);
    } catch (error) {
      const message =
        (error as { message?: string })?.message ||
        "Could not retrieve applicant details.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return { revealed, pii, isLoading, toggle };
}

function IdentityRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(mono ? "font-mono text-xs" : "font-semibold")}>
        {value}
      </span>
    </div>
  );
}

// =============================================================================
// Body component
//
// Renders everything below the page header — the read-only payload of a score
// request: error banner, decision banner, decline / triggered-rules sections,
// model breakdowns (credit risk, fraud, loan amount, income), legacy sections,
// and the right-hand sidebar (applicant, loan request, scoring metadata,
// timeline, model info).
//
// Both the org and admin score-request detail pages compose this body.
// =============================================================================

interface ScoreRequestDetailBodyProps {
  // The raw response from `GET /v1/score-requests/{id}`. The shape is
  // intentionally untyped here — the upstream model is in flux and the body
  // tolerantly walks each section.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scoreRequest: any;
}

export function ScoreRequestDetailBody({
  scoreRequest,
}: ScoreRequestDetailBodyProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sr = scoreRequest as any;
  const timestamps = sr.timestamps;
  const scoreError = sr.error;

  const result = sr.scoring_result;
  const decision = result?.decision;
  const decisionConfig = decision ? getDecisionConfig(decision) : null;

  const creditRisk = result?.credit_risk;
  const fraudDetection = result?.fraud_detection;
  const loanAmount = result?.loan_amount;
  const incomeVerification = result?.income_verification;
  const scoringMeta = result?.scoring_metadata;
  const conditionsApplied: string[] = result?.condition_applied || [];
  const declineReasons: string[] = result?.decline_reasons || [];
  const triggeredRules: string[] = result?.triggered_rules || [];
  const errors: string[] = result?.errors || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapContributions: any[] = creditRisk?.shap_contributions || [];
  const reasonCodes: string[] = creditRisk?.decision_reason_codes || [];

  const applicant = sr.applicant;

  const reveal = useApplicantReveal(sr.request_id || sr.id);
  const hasMaskedIdentity = Boolean(
    applicant?.national_id_number || applicant?.phone || applicant?.account_number,
  );
  const loanRequest = sr.loan_request;

  // Legacy fields (older requests)
  const score = sr.score;
  const scoreComponents = sr.score_components;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const riskFactors: any[] = sr.risk_factors || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const creditScore = scoringMeta?.credit_score;
  const scoreGrade = scoringMeta?.score_grade ?? null;
  const riskTier = creditRisk?.risk_tier;
  const riskTierConfig = riskTier ? getRiskTierConfig(riskTier) : null;

  return (
    <>
      {/* ───────────── Error state ───────────── */}
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

      {/* ───────────── Decision Banner ───────────── */}
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

      {/* ───────────── Errors, Decline Reasons, Triggered Rules ───────────── */}
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
        {/* ═════════════ Main content ═════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ─── Credit Risk Model ─── */}
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

                {shapContributions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Key Risk Drivers (SHAP)
                    </h4>
                    <div className="space-y-3">
                      {shapContributions.map(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (shap: any, idx: number) => {
                          const isPositive = shap.direction === "positive";
                          const absValue = Math.abs(shap.value);
                          const maxShap = Math.max(
                            ...shapContributions.map(
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (s: any) => Math.abs(s.value),
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
                                    isPositive
                                      ? "bg-red-400"
                                      : "bg-green-400",
                                  )}
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

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

          {/* ─── Fraud Detection ─── */}
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

          {/* ─── Loan Amount Assessment ─── */}
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

          {/* ─── Income Verification ─── */}
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

          {/* ─── Conditions Applied ─── */}
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

          {/* ─── Legacy: Score Components ─── */}
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
                    .map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ([key, component]: [string, any]) => (
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
                            value={
                              (component.score / component.max_score) * 100
                            }
                            className="h-2"
                          />
                        </div>
                      ),
                    )}
                </CardContent>
              </Card>
            )}

          {/* ─── Legacy: Risk Factors ─── */}
          {riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskFactors.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (factor: any, idx: number) => (
                    <div
                      key={factor.code || idx}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="mt-0.5">
                        {getImpactIcon(factor.impact)}
                      </div>
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
                  ),
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Legacy: Recommendations ─── */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (rec: any, index: number) => (
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
                  ),
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Empty State ─── */}
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

        {/* ═════════════ Sidebar ═════════════ */}
        <div className="space-y-6">
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
                  <IdentityRow
                    label="National ID"
                    value={
                      (reveal.revealed && reveal.pii?.nationalIdNumber) ||
                      applicant.national_id_number
                    }
                    mono
                  />
                )}
                {applicant.phone && (
                  <IdentityRow
                    label="Phone"
                    value={
                      (reveal.revealed && reveal.pii?.phone) || applicant.phone
                    }
                  />
                )}
                {applicant.account_number && (
                  <IdentityRow
                    label="Account No."
                    value={
                      (reveal.revealed && reveal.pii?.accountNumber) ||
                      applicant.account_number
                    }
                    mono
                  />
                )}

                {hasMaskedIdentity && (
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={reveal.toggle}
                      disabled={reveal.isLoading}
                      aria-pressed={reveal.revealed}
                    >
                      {reveal.isLoading ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : reveal.revealed ? (
                        <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                      ) : (
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {reveal.revealed
                        ? "Hide full details"
                        : "Reveal full details"}
                    </Button>
                    {!reveal.revealed && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Revealing is recorded in the audit log.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
    </>
  );
}
