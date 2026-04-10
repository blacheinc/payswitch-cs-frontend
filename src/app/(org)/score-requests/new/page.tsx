"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  CreditCard,
  Database,
  Sparkles,
  Loader2,
  Search,
  Shield,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { format, parse, isValid, parseISO } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constant";
import {
  scoreService,
  SCORE_KEYS,
  type BureauLookupResult,
  type BureauLookupPayload,
  type CreateScoreRequestPayload,
} from "@/lib/score-service";

// =============================================================================
// Date helpers — bureau API may return dates in various formats
// =============================================================================

function safeParseDateStr(value: string): Date | undefined {
  if (!value) return undefined;
  const d1 = parse(value, "yyyy-MM-dd", new Date());
  if (isValid(d1)) return d1;
  const d2 = parse(value, "dd/MM/yyyy", new Date());
  if (isValid(d2)) return d2;
  const d3 = parseISO(value);
  if (isValid(d3)) return d3;
  const d4 = new Date(value);
  if (isValid(d4)) return d4;
  return undefined;
}

function safeFormatDate(value: string, displayFormat = "PPP"): string {
  const d = safeParseDateStr(value);
  return d ? format(d, displayFormat) : value;
}

function safeNormalizeDateStr(value: string): string {
  const d = safeParseDateStr(value);
  return d ? format(d, "yyyy-MM-dd") : value;
}

// =============================================================================
// Auto-generate reference ID
// =============================================================================

function generateReferenceId(): string {
  const now = new Date();
  const datePart = format(now, "yyyyMMdd");
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REF-${datePart}-${randomPart}`;
}

// =============================================================================
// Feature labels — human-readable names for the bureau feature keys
// =============================================================================

const FEATURE_LABELS: Record<string, string> = {
  highest_delinquency_rating: "Highest Delinquency Rating",
  months_on_time_24m: "Months On-Time (24m)",
  worst_arrears_24m: "Worst Arrears (24m)",
  current_streak_on_time: "Current On-Time Streak",
  has_active_arrears: "Has Active Arrears",
  total_arrear_amount_ghs: "Total Arrear Amount (GHS)",
  total_outstanding_debt_ghs: "Total Outstanding Debt (GHS)",
  utilisation_ratio: "Utilisation Ratio",
  num_active_accounts: "Active Accounts",
  total_monthly_instalment_ghs: "Monthly Instalment (GHS)",
  credit_age_months: "Credit Age (Months)",
  num_accounts_total: "Total Accounts",
  num_closed_accounts_good: "Closed Accounts (Good)",
  product_diversity_score: "Product Diversity Score",
  mobile_loan_history_count: "Mobile Loan History Count",
  mobile_max_loan_ghs: "Mobile Max Loan (GHS)",
  has_judgement: "Has Judgement",
  has_written_off: "Has Write-Off",
  has_charged_off: "Has Charge-Off",
  has_legal_handover: "Has Legal Handover",
  num_bounced_cheques: "Bounced Cheques",
  has_adverse_default: "Has Adverse Default",
  num_enquiries_3m: "Enquiries (3m)",
  num_enquiries_12m: "Enquiries (12m)",
  enquiry_reason_flags: "Enquiry Reason Flags",
  applicant_age: "Applicant Age",
  identity_verified: "Identity Verified",
  num_dependants: "Dependants",
  has_employer_detail: "Has Employer Detail",
  address_stability: "Address Stability",
};

function getFeatureLabel(key: string): string {
  return (
    FEATURE_LABELS[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// =============================================================================
// Schemas
// =============================================================================

/** Step 1 — Applicant Info */
const applicantSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationalIdNumber: z.string().optional(),
  phone: z.string().optional(),
  accountNumber: z.string().optional(),
  referenceId: z.string().min(1, "Reference ID is required"),
});

/** Step 2 — Loan Details */
const loanSchema = z.object({
  amount: z
    .string()
    .min(1, "Loan amount is required")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      "Must be a positive number",
    ),
  tenureMonths: z
    .string()
    .min(1, "Tenure is required")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 360,
      "Must be between 1 and 360 months",
    ),
  purpose: z.string().optional(),
});

type ApplicantFormData = z.infer<typeof applicantSchema>;
type LoanFormData = z.infer<typeof loanSchema>;

// =============================================================================
// Constants
// =============================================================================

const STEPS = [
  { id: 1, name: "Applicant Info", icon: User },
  { id: 2, name: "Loan Details", icon: CreditCard },
  { id: 3, name: "Bureau Data", icon: Database },
  { id: 4, name: "Generate Score", icon: Sparkles },
];

// =============================================================================
// Page Component
// =============================================================================

export default function NewScoreRequestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Flow state ──
  const [currentStep, setCurrentStep] = useState(1);
  const [bureauResult, setBureauResult] = useState<BureauLookupResult | null>(
    null,
  );
  // Editable features — initialized from bureau response, user can modify
  const [editableFeatures, setEditableFeatures] = useState<
    Record<string, number | null>
  >({});

  // ── Bureau details expand/collapse in review ──
  const [showBureauDetails, setShowBureauDetails] = useState(false);

  // ── Step 1: Applicant form ──
  const applicantForm = useForm<ApplicantFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(applicantSchema) as any,
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      nationalIdNumber: "",
      phone: "",
      accountNumber: "",
      referenceId: generateReferenceId(),
    },
  });

  // ── Step 2: Loan form ──
  const loanForm = useForm<LoanFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(loanSchema) as any,
    defaultValues: {
      amount: "",
      tenureMonths: "",
      purpose: "",
    },
  });

  const applicantData = applicantForm.watch();
  const loanData = loanForm.watch();

  // ═══════════════════════════════════════════════════════════════════════════
  // Mutations
  // ═══════════════════════════════════════════════════════════════════════════

  /** Bureau lookup — triggered when moving from Step 2 → Step 3 */
  const bureauLookupMutation = useMutation({
    mutationFn: (payload: BureauLookupPayload) =>
      scoreService.bureauLookup(payload),
    onSuccess: (result) => {
      setBureauResult(result);

      // Initialize editable features from the bureau response
      const features = result.features || {};
      setEditableFeatures({ ...features });

      if (result.bureauHitStatus === "NO_RECORD") {
        toast.warning(
          "No bureau record found. Default feature values will be used.",
        );
      } else if (result.bureauHitStatus === "MULTIPLE_MATCH") {
        toast.warning(
          "Multiple matches found. Please verify the feature values.",
        );
      } else {
        toast.success("Bureau data retrieved successfully!");
      }

      setCurrentStep(3);
    },
    onError: (error) => {
      toast.error(
        (error as any)?.message || "Bureau lookup failed. Please try again.",
      );
    },
  });

  /** Score request creation — triggered from Step 4 */
  const createScoreRequestMutation = useMutation({
    mutationFn: (payload: CreateScoreRequestPayload) =>
      scoreService.createScoreRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCORE_KEYS.all });
      toast.success("Credit score generated successfully!");
      router.push(ROUTES.ORG.SCORE_REQUESTS);
    },
    onError: (error) => {
      toast.error(
        (error as any)?.message ||
          "Failed to generate credit score. Please try again.",
      );
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  /** Step 1 → Step 2: Validate applicant info */
  const handleApplicantNext = async () => {
    const valid = await applicantForm.trigger();
    if (valid) setCurrentStep(2);
  };

  /** Step 2 → Step 3: Validate loan details, then trigger bureau lookup */
  const handleLoanNext = async () => {
    const valid = await loanForm.trigger();
    if (!valid) return;

    const applicant = applicantForm.getValues();

    bureauLookupMutation.mutate({
      fullName: applicant.fullName || undefined,
      dateOfBirth: applicant.dateOfBirth,
      identification: applicant.nationalIdNumber || undefined,
      phoneNumber: applicant.phone || undefined,
      accountNumber: applicant.accountNumber || undefined,
    });
  };

  /** Step 3 → Step 4: Move to review (features are already stored in state) */
  const handleBureauNext = () => {
    setCurrentStep(4);
  };

  /** Step 4: Generate credit score */
  const handleGenerateScore = () => {
    if (!bureauResult) return;

    const applicant = applicantForm.getValues();
    const loan = loanForm.getValues();

    createScoreRequestMutation.mutate({
      referenceId: applicant.referenceId || undefined,
      applicant: {
        fullName: applicant.fullName,
        dateOfBirth: applicant.dateOfBirth,
        nationalIdNumber: applicant.nationalIdNumber || undefined,
        phone: applicant.phone || undefined,
        accountNumber: applicant.accountNumber || undefined,
      },
      loanRequest: {
        amount: Number(loan.amount),
        tenureMonths: Number(loan.tenureMonths),
        purpose: loan.purpose || undefined,
      },
      bureauData: {
        consumerId: bureauResult.consumerId || "",
        bureauHitStatus: bureauResult.bureauHitStatus,
        productSource: bureauResult.metadata?.productSource || null,
        creditSummary: null,
        creditAccounts: null,
        features: editableFeatures,
      },
      channel: "web_portal",
    });
  };

  /** Update a single feature value */
  const updateFeature = (key: string, value: string) => {
    setEditableFeatures((prev) => ({
      ...prev,
      [key]: value === "" ? null : Number(value),
    }));
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════════════════════════

  const fmtGHS = (value: number | null | undefined) =>
    value != null
      ? `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`
      : "—";

  const renderStepContent = () => {
    switch (currentStep) {
      // ─── Step 1: Applicant Info ────────────────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Kwame Asante"
                  {...applicantForm.register("fullName")}
                />
                {applicantForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {applicantForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dateOfBirth"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9",
                        !applicantData.dateOfBirth && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {applicantData.dateOfBirth
                        ? safeFormatDate(applicantData.dateOfBirth)
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={safeParseDateStr(
                        applicantData.dateOfBirth || "",
                      )}
                      onSelect={(date) =>
                        applicantForm.setValue(
                          "dateOfBirth",
                          date ? format(date, "yyyy-MM-dd") : "",
                        )
                      }
                      captionLayout="dropdown"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {applicantForm.formState.errors.dateOfBirth && (
                  <p className="text-sm text-destructive">
                    {applicantForm.formState.errors.dateOfBirth.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nationalIdNumber">
                  National ID / Ghana Card
                </Label>
                <Input
                  id="nationalIdNumber"
                  placeholder="GHA-123456789-0"
                  {...applicantForm.register("nationalIdNumber")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+233 20 123 4567"
                  {...applicantForm.register("phone")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="Bank account number (optional)"
                  {...applicantForm.register("accountNumber")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceId">Reference ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="referenceId"
                    placeholder="REF-20260408-A1B2C"
                    {...applicantForm.register("referenceId")}
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() =>
                      applicantForm.setValue(
                        "referenceId",
                        generateReferenceId(),
                      )
                    }
                    title="Regenerate reference ID"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-generated. Edit or regenerate as needed.
                </p>
                {applicantForm.formState.errors.referenceId && (
                  <p className="text-sm text-destructive">
                    {applicantForm.formState.errors.referenceId.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      // ─── Step 2: Loan Details ──────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Loan Amount (GHS) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="50000"
                  {...loanForm.register("amount")}
                />
                {loanForm.formState.errors.amount && (
                  <p className="text-sm text-destructive">
                    {loanForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenureMonths">Tenure (months) *</Label>
                <Input
                  id="tenureMonths"
                  type="number"
                  min={1}
                  max={360}
                  placeholder="24"
                  {...loanForm.register("tenureMonths")}
                />
                {loanForm.formState.errors.tenureMonths && (
                  <p className="text-sm text-destructive">
                    {loanForm.formState.errors.tenureMonths.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="purpose">Loan Purpose</Label>
                <Select
                  value={loanData.purpose || ""}
                  onValueChange={(value) => loanForm.setValue("purpose", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="debt_consolidation">
                      Debt Consolidation
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      // ─── Step 3: Bureau Data (Editable Features) ───────────────────────
      case 3:
        return (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              <Pencil className="h-3.5 w-3.5 shrink-0" />
              <span>
                These values were retrieved from the credit bureau. You may edit
                any value before generating the credit score.
              </span>
            </div>

            {/* Bureau hit status */}
            {bureauResult && (
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant={
                    bureauResult.bureauHitStatus === "HIT"
                      ? "default"
                      : "secondary"
                  }
                >
                  {bureauResult.bureauHitStatus}
                </Badge>
                {bureauResult.consumerId && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Consumer: {bureauResult.consumerId}
                  </span>
                )}
                {bureauResult.metadata?.creditScore != null && (
                  <Badge variant="outline" className="text-xs font-mono">
                    Bureau Score: {bureauResult.metadata.creditScore}
                  </Badge>
                )}
                {bureauResult.metadata?.scoreGrade && (
                  <Badge
                    variant={
                      bureauResult.metadata.scoreGrade <= "B"
                        ? "default"
                        : bureauResult.metadata.scoreGrade <= "D"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    Grade {bureauResult.metadata.scoreGrade}
                  </Badge>
                )}
              </div>
            )}

            {/* Feature fields grid */}
            {Object.keys(editableFeatures).length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-300/30 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  No feature data returned from the bureau. You may still
                  proceed — the model will use default values.
                </span>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(editableFeatures).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label
                      htmlFor={`feature_${key}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      {getFeatureLabel(key)}
                    </Label>
                    <Input
                      id={`feature_${key}`}
                      type="number"
                      step="any"
                      value={value ?? ""}
                      onChange={(e) => updateFeature(key, e.target.value)}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // ─── Step 4: Review & Generate ─────────────────────────────────────
      case 4: {
        const applicant = applicantForm.getValues();
        const loan = loanForm.getValues();
        const featureCount = Object.keys(editableFeatures).length;
        const editedCount = bureauResult?.features
          ? Object.entries(editableFeatures).filter(
              ([k, v]) => (bureauResult.features as any)?.[k] !== v,
            ).length
          : 0;

        return (
          <div className="space-y-6">
            {/* Applicant summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Applicant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium">
                    {applicant.fullName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">
                    {applicant.dateOfBirth
                      ? safeFormatDate(applicant.dateOfBirth)
                      : "—"}
                  </span>
                </div>
                {applicant.nationalIdNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">National ID</span>
                    <span className="font-medium">
                      {applicant.nationalIdNumber}
                    </span>
                  </div>
                )}
                {applicant.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{applicant.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference ID</span>
                  <span className="font-medium font-mono text-xs">
                    {applicant.referenceId}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Loan summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Loan Request
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    GHS {Number(loan.amount || 0).toLocaleString("en-GH")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-medium">
                    {loan.tenureMonths || "0"} months
                  </span>
                </div>
                {loan.purpose && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purpose</span>
                    <span className="font-medium capitalize">
                      {loan.purpose.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bureau data summary */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    Bureau Features
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {featureCount} features
                    </Badge>
                    {editedCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {editedCount} edited
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBureauDetails(!showBureauDetails)}
                      className="h-7 px-2"
                    >
                      {showBureauDetails ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {showBureauDetails && (
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(editableFeatures).map(([key, value]) => {
                      const original = (bureauResult?.features as any)?.[key];
                      const isEdited = original !== value;
                      return (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs truncate">
                            {getFeatureLabel(key)}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-xs shrink-0",
                              isEdited
                                ? "font-semibold text-primary"
                                : "text-foreground",
                            )}
                          >
                            {value ?? "—"}
                            {isEdited && " ✎"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={ROUTES.ORG.SCORE_REQUESTS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Score Request</h1>
          <p className="text-muted-foreground">
            {STEPS[currentStep - 1].name} — Step {currentStep} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  currentStep > step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === step.id
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground",
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 hidden sm:block whitespace-nowrap",
                  currentStep >= step.id
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.name}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-6 sm:w-12 h-0.5 mx-1.5",
                  currentStep > step.id ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Card content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].name}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter the applicant's personal information."}
            {currentStep === 2 &&
              "Provide the loan details. Bureau data will be fetched automatically."}
            {currentStep === 3 &&
              "Review and edit the bureau feature data used for scoring."}
            {currentStep === 4 &&
              "Review all information and generate the credit score."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep === 1 ? (
              <Button variant="outline" asChild>
                <Link href={ROUTES.ORG.SCORE_REQUESTS}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={
                  bureauLookupMutation.isPending ||
                  createScoreRequestMutation.isPending
                }
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}

            {currentStep === 1 && (
              <Button type="button" onClick={handleApplicantNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === 2 && (
              <Button
                type="button"
                onClick={handleLoanNext}
                disabled={bureauLookupMutation.isPending}
              >
                {bureauLookupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching Bureau Data...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Fetch Bureau Data
                  </>
                )}
              </Button>
            )}
            {currentStep === 3 && (
              <Button type="button" onClick={handleBureauNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {currentStep === 4 && (
              <Button
                type="button"
                onClick={handleGenerateScore}
                disabled={createScoreRequestMutation.isPending}
              >
                {createScoreRequestMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Score...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Credit Score
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
