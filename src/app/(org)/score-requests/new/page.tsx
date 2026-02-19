"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Briefcase,
  CreditCard,
  Wallet,
  FileCheck,
  Send,
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constant";

// Form schema
const scoreRequestSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  nationalIdType: z.enum([
    "ghana_card",
    "voter_id",
    "passport",
    "drivers_license",
  ]),
  nationalIdNumber: z.string().min(1, "ID number is required"),
  gender: z.enum(["male", "female", "other"]).optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),

  // Employment
  employmentStatus: z.enum([
    "employed",
    "self_employed",
    "unemployed",
    "retired",
    "student",
  ]),
  employerName: z.string().optional(),
  jobTitle: z.string().optional(),
  employmentDuration: z.string().optional(),
  monthlyIncome: z.string().min(1, "Monthly income is required"),
  otherIncome: z.string().optional(),

  // Loan Details
  loanAmount: z.string().min(1, "Loan amount is required"),
  loanPurpose: z.enum([
    "personal",
    "business",
    "education",
    "housing",
    "vehicle",
    "medical",
    "agriculture",
    "other",
  ]),
  loanTenure: z.string().min(1, "Loan tenure is required"),
  collateralType: z
    .enum(["none", "vehicle", "property", "equipment", "guarantor", "other"])
    .optional(),

  // Financial Profile
  hasExistingLoans: z.boolean().default(false),
  existingLoanBalance: z.string().optional(),
  existingLoanPayment: z.string().optional(),
  hasBankAccount: z.boolean().default(false),
  hasMobileMoney: z.boolean().default(false),

  // Alternative Data
  utilityHistory: z
    .enum(["excellent", "good", "fair", "poor", "no_data"])
    .default("no_data"),
  rentHistory: z
    .enum(["excellent", "good", "fair", "poor", "no_data"])
    .default("no_data"),
  telcoAccountAge: z.string().optional(),
  telcoAvgSpend: z.string().optional(),
  telcoPaymentRegularity: z
    .enum(["always_on_time", "mostly_on_time", "sometimes_late", "often_late"])
    .default("always_on_time"),

  // Consent
  bureauConsent: z
    .boolean()
    .refine((val) => val === true, "Bureau consent is required"),
  dataSharingConsent: z.boolean().default(false),

  // Reference
  referenceId: z.string().optional(),
});

type FormData = z.infer<typeof scoreRequestSchema>;

const steps = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "Employment", icon: Briefcase },
  { id: 3, name: "Loan Details", icon: CreditCard },
  { id: 4, name: "Financial", icon: Wallet },
  { id: 5, name: "Alt Data", icon: Zap },
  { id: 6, name: "Consent", icon: FileCheck },
  { id: 7, name: "Review", icon: Send },
];

export default function NewScoreRequestPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(scoreRequestSchema) as any,
    defaultValues: {
      nationalIdType: "ghana_card",
      employmentStatus: "employed",
      loanPurpose: "personal",
      hasExistingLoans: false,
      hasBankAccount: false,
      hasMobileMoney: false,
      utilityHistory: "no_data",
      rentHistory: "no_data",
      telcoPaymentRegularity: "always_on_time",
      bureauConsent: false,
      dataSharingConsent: false,
    },
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const watchedValues = watch();

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success("Score request submitted successfully!");
      router.push(ROUTES.ORG.SCORE_REQUESTS);
    } catch (error) {
      toast.error(
        (error as Error).message ||
          "Failed to submit score request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Kwame Asante"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth")}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-destructive">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nationalIdType">ID Type *</Label>
                <Select
                  value={watchedValues.nationalIdType}
                  onValueChange={(value) =>
                    setValue(
                      "nationalIdType",
                      value as FormData["nationalIdType"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ghana_card">Ghana Card</SelectItem>
                    <SelectItem value="voter_id">Voter ID</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">
                      Driver&apos;s License
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalIdNumber">ID Number *</Label>
                <Input
                  id="nationalIdNumber"
                  placeholder="GHA-123456789-0"
                  {...register("nationalIdNumber")}
                />
                {errors.nationalIdNumber && (
                  <p className="text-sm text-destructive">
                    {errors.nationalIdNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={watchedValues.gender || ""}
                  onValueChange={(value) =>
                    setValue("gender", value as FormData["gender"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+233 20 123 4567"
                  {...register("phone")}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kwame@example.com"
                  {...register("email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Residential Address</Label>
                <Input
                  id="address"
                  placeholder="123 Independence Ave, Accra"
                  {...register("address")}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status *</Label>
                <Select
                  value={watchedValues.employmentStatus}
                  onValueChange={(value) =>
                    setValue(
                      "employmentStatus",
                      value as FormData["employmentStatus"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="self_employed">Self-Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerName">Employer Name</Label>
                <Input
                  id="employerName"
                  placeholder="Company name"
                  {...register("employerName")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="Sales Manager"
                  {...register("jobTitle")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentDuration">Employment Duration</Label>
                <Input
                  id="employmentDuration"
                  placeholder="e.g., 3 years"
                  {...register("employmentDuration")}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income (GHS) *</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  placeholder="5000"
                  {...register("monthlyIncome")}
                />
                {errors.monthlyIncome && (
                  <p className="text-sm text-destructive">
                    {errors.monthlyIncome.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherIncome">Other Income (GHS)</Label>
                <Input
                  id="otherIncome"
                  type="number"
                  placeholder="0"
                  {...register("otherIncome")}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount (GHS) *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  placeholder="50000"
                  {...register("loanAmount")}
                />
                {errors.loanAmount && (
                  <p className="text-sm text-destructive">
                    {errors.loanAmount.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanTenure">Loan Tenure (months) *</Label>
                <Input
                  id="loanTenure"
                  type="number"
                  placeholder="24"
                  {...register("loanTenure")}
                />
                {errors.loanTenure && (
                  <p className="text-sm text-destructive">
                    {errors.loanTenure.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="loanPurpose">Loan Purpose *</Label>
                <Select
                  value={watchedValues.loanPurpose}
                  onValueChange={(value) =>
                    setValue("loanPurpose", value as FormData["loanPurpose"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="agriculture">Agriculture</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="collateralType">Collateral Type</Label>
                <Select
                  value={watchedValues.collateralType || "none"}
                  onValueChange={(value) =>
                    setValue(
                      "collateralType",
                      value as FormData["collateralType"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collateral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                    <SelectItem value="property">Property</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="guarantor">Guarantor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceId">Your Reference ID (Optional)</Label>
              <Input
                id="referenceId"
                placeholder="LOAN-2025-001"
                {...register("referenceId")}
              />
              <p className="text-xs text-muted-foreground">
                Your internal reference for tracking this application
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasExistingLoans"
                  checked={watchedValues.hasExistingLoans}
                  onCheckedChange={(checked) =>
                    setValue("hasExistingLoans", checked as boolean)
                  }
                />
                <Label htmlFor="hasExistingLoans">
                  Applicant has existing loans
                </Label>
              </div>

              {watchedValues.hasExistingLoans && (
                <div className="grid gap-4 md:grid-cols-2 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="existingLoanBalance">
                      Outstanding Balance (GHS)
                    </Label>
                    <Input
                      id="existingLoanBalance"
                      type="number"
                      placeholder="0"
                      {...register("existingLoanBalance")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="existingLoanPayment">
                      Monthly Payment (GHS)
                    </Label>
                    <Input
                      id="existingLoanPayment"
                      type="number"
                      placeholder="0"
                      {...register("existingLoanPayment")}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBankAccount"
                  checked={watchedValues.hasBankAccount}
                  onCheckedChange={(checked) =>
                    setValue("hasBankAccount", checked as boolean)
                  }
                />
                <Label htmlFor="hasBankAccount">
                  Applicant has a bank account
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasMobileMoney"
                  checked={watchedValues.hasMobileMoney}
                  onCheckedChange={(checked) =>
                    setValue("hasMobileMoney", checked as boolean)
                  }
                />
                <Label htmlFor="hasMobileMoney">
                  Applicant uses mobile money
                </Label>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Utility & Rent History</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Utility Payment History</Label>
                  <Select
                    value={watchedValues.utilityHistory}
                    onValueChange={(val) =>
                      setValue("utilityHistory", val as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">
                        Excellent (No delays)
                      </SelectItem>
                      <SelectItem value="good">Good (1-2 delays)</SelectItem>
                      <SelectItem value="fair">
                        Fair (Frequent delays)
                      </SelectItem>
                      <SelectItem value="poor">Poor (Disconnected)</SelectItem>
                      <SelectItem value="no_data">No Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rent Payment History</Label>
                  <Select
                    value={watchedValues.rentHistory}
                    onValueChange={(val) => setValue("rentHistory", val as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="no_data">No Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Telco & Mobile Money Data</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account Age (Months)</Label>
                  <Input
                    type="number"
                    placeholder="24"
                    {...register("telcoAccountAge")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avg. Monthly Spend (GHS)</Label>
                  <Input
                    type="number"
                    placeholder="150"
                    {...register("telcoAvgSpend")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Regularity</Label>
                <Select
                  value={watchedValues.telcoPaymentRegularity}
                  onValueChange={(val) =>
                    setValue("telcoPaymentRegularity", val as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always_on_time">
                      Always on time
                    </SelectItem>
                    <SelectItem value="mostly_on_time">
                      Mostly on time
                    </SelectItem>
                    <SelectItem value="sometimes_late">
                      Sometimes late
                    </SelectItem>
                    <SelectItem value="often_late">Often late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="bureauConsent"
                    checked={watchedValues.bureauConsent}
                    onCheckedChange={(checked) =>
                      setValue("bureauConsent", checked as boolean)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="bureauConsent" className="font-medium">
                      Credit Bureau Check Authorization *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I confirm that the applicant has provided consent for
                      their credit information to be retrieved from credit
                      bureaus for the purpose of this loan assessment.
                    </p>
                  </div>
                </div>
                {errors.bureauConsent && (
                  <p className="text-sm text-destructive mt-2">
                    {errors.bureauConsent.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="dataSharingConsent"
                    checked={watchedValues.dataSharingConsent}
                    onCheckedChange={(checked) =>
                      setValue("dataSharingConsent", checked as boolean)
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="dataSharingConsent" className="font-medium">
                      Data Sharing for Model Improvement (Optional)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I consent to anonymized loan performance data being used
                      to improve credit scoring models for the benefit of all
                      platform users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium">
                    {watchedValues.fullName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span className="font-medium">
                    {watchedValues.dateOfBirth || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Number</span>
                  <span className="font-medium">
                    {watchedValues.nationalIdNumber || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">
                    {watchedValues.phone || "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Employment & Income</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Employment Status
                  </span>
                  <span className="font-medium capitalize">
                    {watchedValues.employmentStatus?.replace("_", " ") || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employer</span>
                  <span className="font-medium">
                    {watchedValues.employerName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Income</span>
                  <span className="font-medium">
                    GHS {watchedValues.monthlyIncome || "0"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loan Request</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    GHS {watchedValues.loanAmount || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenure</span>
                  <span className="font-medium">
                    {watchedValues.loanTenure || "0"} months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purpose</span>
                  <span className="font-medium capitalize">
                    {watchedValues.loanPurpose || "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Alternative Data Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utility History</span>
                  <span className="font-medium capitalize">
                    {watchedValues.utilityHistory || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent History</span>
                  <span className="font-medium capitalize">
                    {watchedValues.rentHistory || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Telco Regularity
                  </span>
                  <span className="font-medium capitalize">
                    {watchedValues.telcoPaymentRegularity?.replace("_", " ") ||
                      "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

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
            Submit a new credit score request
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {steps.map((step, index) => (
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
                  "text-xs mt-1 hidden sm:block",
                  currentStep >= step.id
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 sm:w-16 h-0.5 mx-2",
                  currentStep > step.id ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].name}</CardTitle>
          <CardDescription>
            Step {currentStep} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {renderStepContent()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
