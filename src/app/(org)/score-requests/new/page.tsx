"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
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
  RefreshCw,
} from "lucide-react";
import { format, parse, isValid, parseISO } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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

function formatFeatureValue(
  value: string | boolean | null | undefined,
): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
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
    mode: "onTouched",
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
    mode: "onTouched",
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Mutations
  // ═══════════════════════════════════════════════════════════════════════════

  /** Bureau lookup — triggered when moving from Step 2 → Step 3 */
  const bureauLookupMutation = useMutation({
    mutationFn: (payload: BureauLookupPayload) =>
      scoreService.bureauLookup(payload),
    onSuccess: (result) => {
      setBureauResult(result);

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
        features: bureauResult.features || null,
      },
      channel: "web_portal",
    });
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render helpers
  // ═══════════════════════════════════════════════════════════════════════════

  const renderStepContent = () => {
    switch (currentStep) {
      // ─── Step 1: Applicant Info ────────────────────────────────────────
      case 1:
        return (
          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="fullName"
                control={applicantForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="fullName" required>
                      Full Name
                    </FieldLabel>
                    <Input
                      id="fullName"
                      placeholder="Kwame Asante"
                      aria-invalid={fieldState.invalid}
                      autoComplete="name"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="dateOfBirth"
                control={applicantForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="dateOfBirth" required>
                      Date of Birth
                    </FieldLabel>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="nationalIdNumber"
                control={applicantForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="nationalIdNumber">
                      National ID / Ghana Card
                    </FieldLabel>
                    <Input
                      id="nationalIdNumber"
                      placeholder="GHA-123456789-0"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={applicantForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <Input
                      id="phone"
                      placeholder="+233 20 123 4567"
                      aria-invalid={fieldState.invalid}
                      autoComplete="tel"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="accountNumber"
                control={applicantForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="accountNumber">Account Number</FieldLabel>
                    <Input
                      id="accountNumber"
                      placeholder="Bank account number (optional)"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="referenceId"
                control={applicantForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="referenceId" required>
                      Reference ID
                    </FieldLabel>
                    <div className="flex gap-2">
                      <Input
                        id="referenceId"
                        placeholder="REF-20260408-A1B2C"
                        className="font-mono text-sm"
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => field.onChange(generateReferenceId())}
                        title="Regenerate reference ID"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FieldDescription>
                      Auto-generated. Edit or regenerate as needed.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        );

      // ─── Step 2: Loan Details ──────────────────────────────────────────
      case 2:
        return (
          <FieldGroup className="gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="amount" required>
                  Loan Amount (GHS)
                </FieldLabel>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="50000"
                  aria-invalid={!!loanForm.formState.errors.amount}
                  {...loanForm.register("amount")}
                />
                {loanForm.formState.errors.amount && (
                  <FieldError errors={[loanForm.formState.errors.amount]} />
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="tenureMonths" required>
                  Tenure (months)
                </FieldLabel>
                <Input
                  id="tenureMonths"
                  type="text"
                  inputMode="numeric"
                  placeholder="24"
                  aria-invalid={!!loanForm.formState.errors.tenureMonths}
                  {...loanForm.register("tenureMonths")}
                />
                {loanForm.formState.errors.tenureMonths && (
                  <FieldError errors={[loanForm.formState.errors.tenureMonths]} />
                )}
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="purpose"
                control={loanForm.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor="purpose">Loan Purpose</FieldLabel>
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger id="purpose" aria-invalid={fieldState.invalid}>
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        );

      // ─── Step 3: Bureau Data (Read-only) ─────────────────────────────
      case 3: {
        const features = bureauResult?.features;
        const featureEntries = features
          ? Object.entries(features)
          : [];

        return (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
              <Database className="h-3.5 w-3.5 shrink-0" />
              <span>
                These values were retrieved from the credit bureau and will be
                sent as-is with the score request.
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

            {/* Feature display grid (read-only) */}
            {featureEntries.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-300/30 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  No feature data returned from the bureau. You may still
                  proceed — the model will use default values.
                </span>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {featureEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <span className="text-xs text-muted-foreground truncate">
                      {getFeatureLabel(key)}
                    </span>
                    <span className="font-mono text-xs shrink-0 text-foreground">
                      {formatFeatureValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      // ─── Step 4: Review & Generate ─────────────────────────────────────
      case 4: {
        const applicant = applicantForm.getValues();
        const loan = loanForm.getValues();
        const reviewFeatures = bureauResult?.features || {};
        const featureCount = Object.keys(reviewFeatures).length;

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
                    {Object.entries(reviewFeatures).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs truncate">
                            {getFeatureLabel(key)}
                          </span>
                          <span className="font-mono text-xs shrink-0 text-foreground">
                            {formatFeatureValue(value)}
                          </span>
                        </div>
                    ))}
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
              "Review the bureau feature data that will be used for scoring."}
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
