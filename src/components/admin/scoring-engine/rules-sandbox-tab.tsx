"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Scale,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  RotateCcw,
  Gavel,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { rulesService } from "@/lib/monitoring-service";
import type {
  RuleEvaluateRequest,
  RuleEvaluateResponse,
} from "@/types/monitoring-types";

// ── Feature schema grouped by category ──

interface FeatureFieldDef {
  key: string;
  label: string;
  description: string;
}

interface FeatureGroup {
  id: string;
  label: string;
  fields: FeatureFieldDef[];
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "payment_history",
    label: "Payment History & Delinquency",
    fields: [
      {
        key: "highest_delinquency_rating",
        label: "Highest Delinquency Rating",
        description:
          "Worst delinquency rating across all accounts (0=worst, 1=best)",
      },
      {
        key: "months_on_time_24m",
        label: "On-Time Payments (24m)",
        description: "Proportion of on-time payments in last 24 months",
      },
      {
        key: "worst_arrears_24m",
        label: "Worst Arrears (24m)",
        description: "Worst arrears status in 24-month payment history",
      },
      {
        key: "current_streak_on_time",
        label: "Current On-Time Streak",
        description: "Length of current on-time payment streak",
      },
      {
        key: "has_active_arrears",
        label: "Has Active Arrears",
        description: "Currently has accounts in arrears (0=yes, 1=no)",
      },
    ],
  },
  {
    id: "debt_balances",
    label: "Debt & Balances",
    fields: [
      {
        key: "total_arrear_amount_ghs",
        label: "Total Arrear Amount (GHS)",
        description: "Total arrear amount in GHS (binned 0-1)",
      },
      {
        key: "total_outstanding_debt_ghs",
        label: "Total Outstanding Debt (GHS)",
        description: "Total outstanding debt in GHS (binned 0-1)",
      },
      {
        key: "utilisation_ratio",
        label: "Utilisation Ratio",
        description: "Credit utilisation ratio (balance / limit)",
      },
    ],
  },
  {
    id: "account_portfolio",
    label: "Account Portfolio",
    fields: [
      {
        key: "num_active_accounts",
        label: "Active Accounts",
        description: "Number of active credit accounts (binned 0-1)",
      },
      {
        key: "total_monthly_instalment_ghs",
        label: "Monthly Instalment (GHS)",
        description: "Total monthly instalment obligation in GHS (binned 0-1)",
      },
      {
        key: "credit_age_months",
        label: "Credit Age (Months)",
        description: "Age of oldest credit account in months (binned 0-1)",
      },
      {
        key: "num_accounts_total",
        label: "Total Accounts",
        description: "Total number of credit accounts ever (binned 0-1)",
      },
      {
        key: "num_closed_accounts_good",
        label: "Closed Accounts (Good)",
        description: "Number of accounts closed in good standing",
      },
      {
        key: "product_diversity_score",
        label: "Product Diversity Score",
        description: "Diversity of credit product types",
      },
    ],
  },
  {
    id: "mobile_credit",
    label: "Mobile Credit",
    fields: [
      {
        key: "mobile_loan_history_count",
        label: "Mobile Loan History Count",
        description: "Number of mobile loans from Product 49 history",
      },
      {
        key: "mobile_max_loan_ghs",
        label: "Max Mobile Loan (GHS)",
        description: "Maximum mobile loan amount in GHS (binned 0-1)",
      },
    ],
  },
  {
    id: "adverse_info",
    label: "Adverse Information",
    fields: [
      {
        key: "has_judgement",
        label: "Has Judgement",
        description: "Court judgements (0=no data, 1=no judgements)",
      },
      {
        key: "has_written_off",
        label: "Has Written Off",
        description: "Has written-off accounts",
      },
      {
        key: "has_charged_off",
        label: "Has Charged Off",
        description: "Has charged-off accounts",
      },
      {
        key: "has_legal_handover",
        label: "Has Legal Handover",
        description: "Accounts handed over to legal",
      },
      {
        key: "num_bounced_cheques",
        label: "Bounced Cheques",
        description: "Number of dishonoured cheques (binned 0-1)",
      },
      {
        key: "has_adverse_default",
        label: "Has Adverse Default",
        description: "Has adverse/default records",
      },
    ],
  },
  {
    id: "enquiry_activity",
    label: "Enquiry Activity",
    fields: [
      {
        key: "num_enquiries_3m",
        label: "Enquiries (3m)",
        description: "Credit enquiries in last 3 months (binned 0-1)",
      },
      {
        key: "num_enquiries_12m",
        label: "Enquiries (12m)",
        description: "Credit enquiries in last 12 months (binned 0-1)",
      },
      {
        key: "enquiry_reason_flags",
        label: "Enquiry Reason Flags",
        description: "Encoded enquiry reason pattern",
      },
    ],
  },
  {
    id: "applicant_profile",
    label: "Applicant Profile",
    fields: [
      {
        key: "applicant_age",
        label: "Applicant Age",
        description: "DE computes from birthDate",
      },
      {
        key: "identity_verified",
        label: "Identity Verified",
        description: "1.0 if KYC verified, 0.0 if not",
      },
      {
        key: "num_dependants",
        label: "Number of Dependants",
        description: "Number of dependants (from application)",
      },
      {
        key: "has_employer_detail",
        label: "Has Employer Detail",
        description: "1.0 if employer detail present, 0.60 if not",
      },
      {
        key: "address_stability",
        label: "Address Stability",
        description: "1.0/0.75/0.40 based on address count",
      },
    ],
  },
];

const SCORE_GRADES = ["A", "B", "C", "D", "E", "F"] as const;
const FRAUD_FLAGS = ["LOW", "MEDIUM", "HIGH"] as const;

const DEFAULT_FORM: RuleEvaluateRequest = {
  probability_of_default: 0.15,
  score_grade: "B",
  data_engineer_decision_label: null,
  fraud_risk_flag: null,
  recommended_loan_amount_ghs: null,
  features: null,
  metadata: null,
};

function buildPayload(
  form: RuleEvaluateRequest,
  features: Record<string, string>,
  metadata: { credit_score: string; applicant_age_at_application: string },
): RuleEvaluateRequest {
  const populatedFeatures: Record<string, number> = {};
  for (const [k, v] of Object.entries(features)) {
    if (v !== "") populatedFeatures[k] = parseFloat(v);
  }

  const hasFeatures = Object.keys(populatedFeatures).length > 0;
  const hasCreditScore = metadata.credit_score !== "";
  const hasAge = metadata.applicant_age_at_application !== "";

  return {
    ...form,
    features: hasFeatures ? populatedFeatures : null,
    metadata:
      hasCreditScore || hasAge
        ? {
            credit_score: hasCreditScore
              ? parseFloat(metadata.credit_score)
              : null,
            applicant_age_at_application: hasAge
              ? parseInt(metadata.applicant_age_at_application, 10)
              : null,
          }
        : null,
  };
}

function getDecisionBadge(decision: string) {
  const upper = decision.toUpperCase();
  if (upper === "APPROVE")
    return (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 text-base px-3 py-1"
      >
        <CheckCircle className="mr-1.5 h-4 w-4" />
        Approved
      </Badge>
    );
  if (upper === "DECLINE")
    return (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 text-base px-3 py-1"
      >
        <XCircle className="mr-1.5 h-4 w-4" />
        Declined
      </Badge>
    );
  if (upper === "CONDITIONAL_APPROVE")
    return (
      <Badge
        variant="outline"
        className="bg-lime-50 text-lime-700 border-lime-200 text-base px-3 py-1"
      >
        <AlertTriangle className="mr-1.5 h-4 w-4" />
        Conditional
      </Badge>
    );
  if (upper === "REFER")
    return (
      <Badge
        variant="outline"
        className="bg-yellow-50 text-yellow-700 border-yellow-200 text-base px-3 py-1"
      >
        <Info className="mr-1.5 h-4 w-4" />
        Referred
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-base px-3 py-1">
      {decision}
    </Badge>
  );
}

// ── Reusable feature input row ──

function FeatureInput({
  field,
  value,
  onChange,
}: {
  field: FeatureFieldDef;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_100px] gap-3 items-start">
      <div className="space-y-0.5 min-w-0">
        <Label className="text-xs font-medium truncate block">
          {field.label}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-tight">
          {field.description}
        </p>
      </div>
      <Input
        type="number"
        step="0.01"
        min="0"
        max="1"
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        placeholder="0-1"
        className="h-8 text-xs"
      />
    </div>
  );
}

// ── Main Component ──

export function RulesSandboxTab() {
  const [form, setForm] = useState<RuleEvaluateRequest>({ ...DEFAULT_FORM });
  const [features, setFeatures] = useState<Record<string, string>>({});
  const [metadata, setMetadata] = useState({
    credit_score: "",
    applicant_age_at_application: "",
  });
  const [result, setResult] = useState<RuleEvaluateResponse | null>(null);

  const evaluateMutation = useMutation({
    mutationFn: (payload: RuleEvaluateRequest) =>
      rulesService.evaluate(payload),
    onSuccess: (data) => {
      setResult(data);
      toast.success("Rules evaluated successfully");
    },
    onError: (err: { message?: string }) => {
      toast.error(err?.message || "Rule evaluation failed");
    },
  });

  const handleSubmit = () => {
    if (form.probability_of_default < 0 || form.probability_of_default > 1) {
      toast.error("Probability of Default must be between 0 and 1");
      return;
    }
    setResult(null);
    evaluateMutation.mutate(buildPayload(form, features, metadata));
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_FORM });
    setFeatures({});
    setMetadata({ credit_score: "", applicant_age_at_application: "" });
    setResult(null);
  };

  const handleFeatureChange = (key: string, value: string) => {
    setFeatures((prev) => ({ ...prev, [key]: value }));
  };

  const populatedCount = Object.values(features).filter((v) => v !== "").length;

  return (
    <div className="space-y-6">
      {/* Action bar — matches page-level CTA pattern */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Sandbox rule evaluation — test scoring rules without persisting data
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button disabled={evaluateMutation.isPending} onClick={handleSubmit}>
            {evaluateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Evaluate
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Core Parameters */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Evaluation Input</CardTitle>
                  <CardDescription>
                    Core parameters for scoring rules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pd">
                  Probability of Default{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pd"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.probability_of_default}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      probability_of_default: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00 – 1.00"
                />
                <p className="text-xs text-muted-foreground">
                  PD value between 0 and 1
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">
                  Score Grade <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.score_grade}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, score_grade: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCORE_GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        Grade {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="decision_label">
                  DE Decision Label{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="decision_label"
                  value={form.data_engineer_decision_label ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      data_engineer_decision_label: e.target.value || null,
                    }))
                  }
                  placeholder="e.g. APPROVE, DECLINE"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fraud_flag">
                  Fraud Risk Flag{" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Select
                  value={form.fraud_risk_flag ?? "none"}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      fraud_risk_flag: v === "none" ? null : v,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {FRAUD_FLAGS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loan_amount">
                  Recommended Loan Amount (GHS){" "}
                  <span className="text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="loan_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.recommended_loan_amount_ghs ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      recommended_loan_amount_ghs: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    }))
                  }
                  placeholder="e.g. 5000.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metadata</CardTitle>
              <CardDescription className="text-xs">
                Additional applicant context sent alongside features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credit_score" className="text-xs">
                  Credit Score
                </Label>
                <Input
                  id="credit_score"
                  type="number"
                  min="0"
                  max="1000"
                  value={metadata.credit_score}
                  onChange={(e) =>
                    setMetadata((m) => ({ ...m, credit_score: e.target.value }))
                  }
                  placeholder="e.g. 615"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="applicant_age" className="text-xs">
                  Applicant Age at Application
                </Label>
                <Input
                  id="applicant_age"
                  type="number"
                  min="18"
                  max="120"
                  value={metadata.applicant_age_at_application}
                  onChange={(e) =>
                    setMetadata((m) => ({
                      ...m,
                      applicant_age_at_application: e.target.value,
                    }))
                  }
                  placeholder="e.g. 34"
                  className="h-8 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">XDS Bureau Features</CardTitle>
                  <CardDescription className="text-xs">
                    30 features extracted from Credit Bureau data — all
                    optional, float 0-1
                  </CardDescription>
                </div>
                {populatedCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {populatedCount}/30
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="multiple" className="w-full">
                {FEATURE_GROUPS.map((group) => (
                  <AccordionItem key={group.id} value={group.id}>
                    <AccordionTrigger className="text-xs font-semibold py-2">
                      {group.label}
                      <Badge
                        variant="outline"
                        className="ml-auto mr-2 text-[10px] px-1.5 py-0"
                      >
                        {group.fields.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-1">
                        {group.fields.map((field) => (
                          <FeatureInput
                            key={field.key}
                            field={field}
                            value={features[field.key] ?? ""}
                            onChange={handleFeatureChange}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Result Panel */}
        <Card className="lg:col-span-3 h-fit lg:sticky lg:top-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gavel className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Evaluation Result</CardTitle>
                <CardDescription>
                  Rules engine output for the given parameters
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!result && !evaluateMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Scale className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-muted-foreground">
                  Submit an evaluation to see rule results here
                </p>
              </div>
            )}

            {evaluateMutation.isPending && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">
                    Decision
                  </span>
                  {getDecisionBadge(result.decision)}
                </div>

                {result.triggered_rules &&
                  result.triggered_rules.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">
                        Triggered Rules ({result.triggered_rules.length})
                      </h3>
                      <div className="space-y-2">
                        {result.triggered_rules.map((rule, idx) => (
                          <div
                            key={rule.rule_id ?? idx}
                            className="flex items-start gap-3 p-3 border rounded-lg"
                          >
                            <Gavel className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {rule.rule_name ??
                                  rule.rule_id ??
                                  `Rule ${idx + 1}`}
                              </p>
                              {rule.details && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {rule.details}
                                </p>
                              )}
                            </div>
                            {rule.result && (
                              <Badge
                                variant="outline"
                                className="capitalize shrink-0"
                              >
                                {rule.result}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {result.conditions_applied &&
                  result.conditions_applied.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">
                          Conditions Applied
                        </h3>
                        <ul className="space-y-1.5">
                          {result.conditions_applied.map((cond, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-yellow-500 shrink-0" />
                              <span className="text-muted-foreground">
                                {cond}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                {result.decline_reasons &&
                  result.decline_reasons.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-destructive">
                          Decline Reasons
                        </h3>
                        <ul className="space-y-1.5">
                          {result.decline_reasons.map((reason, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <XCircle className="h-3.5 w-3.5 mt-0.5 text-destructive shrink-0" />
                              <span className="text-muted-foreground">
                                {reason}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
