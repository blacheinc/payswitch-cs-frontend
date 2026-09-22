"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Radar,
  Shield,
  ShieldAlert,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { authService } from "@/lib/auth-service";
import { useAuth } from "@/contexts/auth-context";
import {
  ROUTES,
  ADMIN_ROUTE_PREFIXES,
  ORG_ROUTE_PREFIXES,
} from "@/lib/constant";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// =============================================================================
// Audience copy & branding
// =============================================================================

export type LoginAudience = "org" | "admin";

interface HeroFeature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface AudienceCopy {
  cardTitle: string;
  cardSubtitle: string;
  submitLabel: string;
  heroHeadline: string;
  heroSubhead: string;
  heroDescription: string;
  heroFeatures: [HeroFeature, HeroFeature, HeroFeature];
  /** TailwindCSS class applied to the left brand panel. Drives the overall
   *  mood — warm/aspirational for org, darker/operational for admin. */
  heroPanelClass: string;
  /** Optional restricted-access strip rendered above the login card. */
  restrictedNotice?: string;
  /** Optional accent class applied to the login card (e.g. top border). */
  cardAccentClass?: string;
  /** Optional little pill rendered next to the logo word-mark. */
  logoBadge?: string;
  dashboardRoute: string;
  expectedUserType: "admin" | "org_user";
  /** Icon shown in the card header next to the title. */
  Icon: React.ComponentType<{ className?: string }>;
  /** For the small "not an X? switch portal" link at the bottom. */
  switchLabel: string;
  switchHref: string;
}

const AUDIENCE: Record<LoginAudience, AudienceCopy> = {
  org: {
    cardTitle: "Organization Portal",
    cardSubtitle: "Sign in as an institution user",
    submitLabel: "Sign in to Portal",
    heroHeadline: "AI-Powered Credit Intelligence for Ghana",
    heroSubhead: "Institutional Lending",
    heroDescription:
      "Make data-driven lending decisions with Ghana's most advanced credit scoring platform.",
    heroFeatures: [
      {
        icon: Shield,
        title: "Bank-Grade Security",
        description: "ISO-certified data protection protocols",
      },
      {
        icon: TrendingUp,
        title: "Alternative Data Insights",
        description: "Scoring beyond traditional credit bureau data",
      },
      {
        icon: Building2,
        title: "Trusted Nationwide",
        description: "The backbone for Ghana's leading institutions",
      },
    ],
    heroPanelClass: "gradient-primary",
    dashboardRoute: ROUTES.ORG.DASHBOARD,
    expectedUserType: "org_user",
    Icon: Building2,
    switchLabel: "Platform admin? Sign in here",
    switchHref: ROUTES.AUTH.ADMIN_LOGIN,
  },
  admin: {
    cardTitle: "Admin Portal",
    cardSubtitle: "Operational access for PaySwitch staff",
    submitLabel: "Sign in to Admin",
    heroHeadline: "Platform Operations & Oversight",
    heroSubhead: "Staff-only access",
    heroDescription:
      "Monitor platform health, govern organizations, and keep the scoring pipeline running.",
    heroFeatures: [
      {
        icon: Radar,
        title: "Platform-wide telemetry",
        description: "Live risk, model-ops, and infrastructure dashboards",
      },
      {
        icon: ShieldAlert,
        title: "Break-glass controls",
        description: "Provision, suspend, and re-role organizations on demand",
      },
      {
        icon: Terminal,
        title: "Audit-logged activity",
        description: "Every admin action is timestamped and attributed",
      },
    ],
    heroPanelClass:
      // Base (light theme): dark slate gives strong contrast against the
      // light form side. In dark theme the app background is already near-
      // black, so we *elevate* slightly (slate-800) and strengthen the
      // colored glows so the panel stays visually distinct from the form.
      "bg-slate-900 dark:bg-slate-800 " +
      "bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.08),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(248,113,113,0.08),transparent_40%)] " +
      "dark:bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(248,113,113,0.16),transparent_45%)] " +
      "border-r border-white/5 dark:border-white/10",
    restrictedNotice:
      "Restricted access · All activity on this portal is logged.",
    cardAccentClass: "border-t-4 border-t-amber-500",
    logoBadge: "Admin",
    dashboardRoute: ROUTES.ADMIN.DASHBOARD,
    expectedUserType: "admin",
    Icon: Shield,
    switchLabel: "Organization user? Sign in here",
    switchHref: ROUTES.AUTH.LOGIN,
  },
};

// =============================================================================
// Validation
// =============================================================================

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const twoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

// =============================================================================
// Returned-URL validation
// =============================================================================
//
// Only accept same-scope, relative `?next=` values. Absolute URLs, protocol-
// relative paths, and cross-scope paths are refused — this blocks open-redirect
// abuse and the "admin logs in, finds themselves on /dashboard" footgun.
// =============================================================================

function safeNextPath(
  raw: string | null,
  audience: LoginAudience,
): string | null {
  if (!raw) return null;
  // Must be a relative path
  if (!raw.startsWith("/")) return null;
  // Must not be protocol-relative (//example.com)
  if (raw.startsWith("//")) return null;
  // Must not be another auth page
  if (
    raw.startsWith(ROUTES.AUTH.LOGIN) ||
    raw.startsWith(ROUTES.AUTH.ADMIN_LOGIN)
  ) {
    return null;
  }
  // Must belong to the caller's audience
  const prefixes =
    audience === "admin" ? ADMIN_ROUTE_PREFIXES : ORG_ROUTE_PREFIXES;
  const matches = prefixes.some(
    (p) => raw === p || raw.startsWith(`${p}/`) || raw.startsWith(`${p}?`),
  );
  return matches ? raw : null;
}

// =============================================================================
// Shell
// =============================================================================

export function LoginShell({ audience }: { audience: LoginAudience }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [tempToken, setTempToken] = useState("");

  const copy = AUDIENCE[audience];
  const redirectAfterLogin =
    safeNextPath(searchParams.get("next"), audience) ?? copy.dashboardRoute;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
    mode: "onTouched",
  });

  // ── Scope enforcement ───────────────────────────────────────────────────
  const verifyScope = (userType: string | undefined): boolean => {
    if (!userType) return false;
    const returnedIsAdmin = userType === "admin";
    const expectedIsAdmin = copy.expectedUserType === "admin";
    return returnedIsAdmin === expectedIsAdmin;
  };

  // ── Mutations ───────────────────────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (result) => {
      if (result?.requires2FA) {
        setTempToken(result?.accessToken || "");
        setIs2FAStep(true);
        toast.info("Please enter your 2FA code");
        return;
      }

      // Scoped session is already set; everything else 401s until changed.
      if (result?.requiresPasswordChange) {
        toast.info("Please set a new password to continue.");
        router.push(ROUTES.AUTH.CHANGE_PASSWORD);
        return;
      }

      if (!verifyScope(result?.userType)) {
        toast.error(
          audience === "admin"
            ? "This account is not a platform admin."
            : "This is a platform-admin account.",
        );
        // Roll the cookie back — we wouldn't want a wrong-scope session
        // sitting around on the server.
        void authService.logout().catch(() => {});
        return;
      }

      if (result?.user && result?.userType) {
        setSession(result.userType, result.user);

        queryClient.prefetchQuery({
          queryKey: ["auth-me"],
          queryFn: () => authService.getMe(),
        });

        toast.success("Welcome back!");
        router.push(redirectAfterLogin);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Login failed. Please try again.");
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: authService.verify2FA,
    onSuccess: (result) => {
      // Scoped session is already set; everything else 401s until changed.
      if (result?.requiresPasswordChange) {
        toast.info("Please set a new password to continue.");
        router.push(ROUTES.AUTH.CHANGE_PASSWORD);
        return;
      }

      if (!verifyScope(result?.userType)) {
        toast.error(
          audience === "admin"
            ? "This account is not a platform admin."
            : "This is a platform-admin account.",
        );
        setIs2FAStep(false);
        setTempToken("");
        twoFactorForm.reset({ code: "" });
        void authService.logout().catch(() => {});
        return;
      }

      if (result?.user && result?.userType) {
        setSession(result.userType, result.user);

        queryClient.prefetchQuery({
          queryKey: ["auth-me"],
          queryFn: () => authService.getMe(),
        });

        toast.success("Welcome back!");
        router.push(redirectAfterLogin);
      }
    },
    onError: (error) => {
      toast.error(error?.message || "Invalid code. Please try again.");
    },
  });

  const isLoading = loginMutation.isPending || verify2FAMutation.isPending;

  // ── Submit handlers ─────────────────────────────────────────────────────
  const handleLoginSubmit = (data: LoginFormData) => {
    loginMutation.mutate({ email: data.email, password: data.password });
  };

  const handle2FASubmit = (data: TwoFactorFormData) => {
    verify2FAMutation.mutate({ code: data.code, tempToken });
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const { Icon } = copy;

  return (
    <div className="min-h-screen flex">
      {/* Left side — brand panel */}
      <div
        className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${copy.heroPanelClass}`}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/payswitch_logo2.png"
              alt="PaySwitch Logo"
              width={160}
              height={60}
              className="object-contain"
            />
            {copy.logoBadge && (
              <span className="rounded-md border border-white/40 bg-white/10 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                {copy.logoBadge}
              </span>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
                {copy.heroHeadline}
              </h1>
              <h2 className="text-2xl font-semibold mb-6 opacity-90">
                {copy.heroSubhead}
              </h2>
              <p className="text-lg text-white/80 max-w-md">
                {copy.heroDescription}
              </p>
            </div>

            <div className="space-y-4">
              {copy.heroFeatures.map((feature) => {
                const FeatureIcon = feature.icon;
                return (
                  <div key={feature.title} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <FeatureIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{feature.title}</p>
                      <p className="text-sm text-white/70">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-white/60">
            © {new Date().getFullYear()} PaySwitch Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden text-center">
            <div className="inline-flex flex-col items-center gap-4 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payswitch_logo.png"
                alt="PaySwitch Logo"
                className="object-contain h-10 w-auto"
              />
              {copy.logoBadge && (
                <span className="rounded-md border border-amber-500/60 bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
                  {copy.logoBadge}
                </span>
              )}
            </div>
          </div>

          {copy.restrictedNotice && (
            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/10 dark:text-amber-200">
              <Lock className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold leading-tight">Staff access only</p>
                <p className="mt-0.5 leading-snug">{copy.restrictedNotice}</p>
              </div>
            </div>
          )}

          <Card
            className={`border-0 shadow-xl overflow-hidden ${copy.cardAccentClass ?? ""}`}
          >
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <Icon className="h-6 w-6 text-primary" />
                {copy.cardTitle}
              </CardTitle>
              <CardDescription>
                {is2FAStep
                  ? "Enter the 6-digit code from your authenticator app"
                  : copy.cardSubtitle}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!is2FAStep ? (
                <form
                  onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                  className="space-y-4"
                >
                  <Controller
                    name="email"
                    control={loginForm.control}
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel htmlFor="email" required>
                          Email
                        </FieldLabel>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@company.com"
                          autoComplete="email"
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                          {...field}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="password" required>
                        Password
                      </FieldLabel>
                      <Link
                        href={ROUTES.AUTH.FORGOT_PASSWORD}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Controller
                        name="password"
                        control={loginForm.control}
                        render={({ field, fieldState }) => (
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            disabled={isLoading}
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                        )}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <FieldError
                        errors={[loginForm.formState.errors.password]}
                      />
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        {copy.submitLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={twoFactorForm.handleSubmit(handle2FASubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <FieldLabel htmlFor="code" required>
                      Verification Code
                    </FieldLabel>
                    <Controller
                      control={twoFactorForm.control}
                      name="code"
                      render={({ field }) => (
                        <div className="pt-2 pb-2">
                          <InputOTP
                            maxLength={6}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isLoading}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot
                                index={0}
                                className="w-12 h-12 text-lg"
                              />
                              <InputOTPSlot
                                index={1}
                                className="w-12 h-12 text-lg"
                              />
                              <InputOTPSlot
                                index={2}
                                className="w-12 h-12 text-lg"
                              />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              <InputOTPSlot
                                index={3}
                                className="w-12 h-12 text-lg"
                              />
                              <InputOTPSlot
                                index={4}
                                className="w-12 h-12 text-lg"
                              />
                              <InputOTPSlot
                                index={5}
                                className="w-12 h-12 text-lg"
                              />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      )}
                    />
                    {twoFactorForm.formState.errors.code && (
                      <FieldError
                        errors={[twoFactorForm.formState.errors.code]}
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setIs2FAStep(false);
                        setTempToken("");
                        twoFactorForm.reset({ code: "" });
                      }}
                      disabled={isLoading}
                    >
                      Back to login
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
