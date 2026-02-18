"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  ArrowRight,
  Shield,
  TrendingUp,
  Building2,
  EyeOff,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { authService } from "@/lib/auth-service";
import { useAuth } from "@/contexts/auth-context";
import { ROUTES } from "@/lib/constant";
import { saveSession } from "@/lib/session-storage";
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
import Image from "next/image";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// 2FA schema
const twoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setSession, requires2FA, setMockAuthenticated } = useAuth();
  const [loginMode, setLoginMode] = useState<"org" | "admin">("admin");
  const [showPassword, setShowPassword] = useState(false);
  const enableTenantToggle =
    process.env.NEXT_PUBLIC_ENABLE_TENANT_TOGGLE === "true";
  console.log("tenantToggle", typeof enableTenantToggle);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 2FA form
  const twoFactorForm = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  // Mutations
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (result) => {
      if (result.requires2FA) {
        toast.info("Please enter your 2FA code");
      } else if (
        result.accessToken &&
        result.refreshToken &&
        result.user &&
        result.userType
      ) {
        setSession(
          result.accessToken,
          result.refreshToken,
          result.userType,
          result.user,
        );
        toast.success("Welcome back!");

        if (loginMode === "admin") {
          router.push(ROUTES.ADMIN.DASHBOARD);
        } else {
          router.push(ROUTES.ORG.DASHBOARD);
        }
      }
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      toast.error(message);
    },
  });

  const verify2FAMutation = useMutation({
    mutationFn: authService.verify2FA,
    onSuccess: (result) => {
      if (
        result.accessToken &&
        result.refreshToken &&
        result.user &&
        result.userType
      ) {
        setSession(
          result.accessToken,
          result.refreshToken,
          result.userType,
          result.user,
        );
        toast.success("Welcome back!");

        if (loginMode === "admin") {
          router.push(ROUTES.ADMIN.DASHBOARD);
        } else {
          router.push(ROUTES.ORG.DASHBOARD);
        }
      }
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Invalid code. Please try again.";
      toast.error(message);
    },
  });

  const isLoading = loginMutation.isPending || verify2FAMutation.isPending;

  // Handle login submit
  const handleLoginSubmit = (data: LoginFormData) => {
    const useMockAuth = process.env.NEXT_PUBLIC_MOCK_AUTH === "true";

    if (useMockAuth) {
      if (data.email.includes("2fa")) {
        toast.info("Please enter your 2FA code");
        return;
      }

      // Persist an encoded mock session so the proxy can read it
      saveSession({
        accessToken: "mock-token",
        refreshToken: "mock-refresh-token",
        userType: loginMode === "admin" ? "admin" : "org",
        user: {
          id: loginMode === "admin" ? "mock-admin" : "mock-user",
          email: data.email,
          name: loginMode === "admin" ? "Admin User" : "Org User",
          roleLabel: loginMode === "admin" ? "admin" : "viewer",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      });
      setMockAuthenticated(loginMode === "admin");
      toast.success("Welcome back!");

      if (loginMode === "admin") {
        router.push(ROUTES.ADMIN.DASHBOARD);
      } else {
        router.push(ROUTES.ORG.DASHBOARD);
      }
      return;
    }

    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  // Handle 2FA submit
  const handle2FASubmit = (data: TwoFactorFormData) => {
    verify2FAMutation.mutate({
      code: data.code,
      tempToken: loginMutation.data?.accessToken || "",
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/payswitch_logo2.png"
              alt="PaySwitch Logo"
              width={160}
              height={60}
              className="object-contain"
            />

            {/* <span className="text-xl font-bold tracking-tight">PaySwitch Credit</span> */}
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight">
                AI-Powered Credit <br /> Intelligence for Ghana
              </h1>
              <h2 className="text-2xl font-semibold mb-6 opacity-90">
                {loginMode === "admin"
                  ? "Platform Governance"
                  : "Institutional Lending"}
              </h2>
              <p className="text-lg text-white/80 max-w-md">
                Make data-driven lending decisions with Ghana&apos;s most
                advanced credit scoring platform.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Bank-Grade Security</p>
                  <p className="text-sm text-white/70">
                    ISO-certified data protection protocols
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    Alternative Data Insights
                  </p>
                  <p className="text-sm text-white/70">
                    Scoring beyond traditional credit bureau data
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Trusted Nationwide</p>
                  <p className="text-sm text-white/70">
                    The backbone for Ghana's leading institutions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/60">
            © 2025 PaySwitch Ltd. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex flex-col items-center gap-4 mb-4">
              <img
                src="/payswitch_logo.png"
                alt="PaySwitch Logo"
                className="object-contain h-10 w-auto"
              />

              {/* <span className="text-2xl font-bold tracking-tight text-primary">
                PaySwitch
              </span> */}
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                {loginMode === "admin" ? (
                  <>
                    <Shield className="h-6 w-6 text-primary" />
                    Admin Portal
                  </>
                ) : (
                  <>
                    <Building2 className="h-6 w-6 text-primary" />
                    Organization Portal
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {requires2FA
                  ? "Enter the 6-digit code from your authenticator app"
                  : `Sign in as ${loginMode === "admin" ? "a platform administrator" : "an institution user"}`}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {!requires2FA ? (
                // Login form
                <form
                  onSubmit={loginForm.handleSubmit(handleLoginSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link
                          href={ROUTES.AUTH.FORGOT_PASSWORD}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...loginForm.register("password")}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Mode Toggle Link */}
                    {!!enableTenantToggle && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 h-auto text-primary font-medium hover:no-underline hover:text-primary/80"
                          onClick={() => {
                            const nextMode =
                              loginMode === "org" ? "admin" : "org";
                            setLoginMode(nextMode);

                            // Pre-fill mock credentials for better demo experience
                            const useMockAuth =
                              process.env.NEXT_PUBLIC_MOCK_AUTH === "true";
                            if (useMockAuth) {
                              if (nextMode === "admin") {
                                loginForm.setValue(
                                  "email",
                                  "admin@payswitch.com.gh",
                                );
                                loginForm.setValue("password", "password123");
                              } else {
                                loginForm.setValue(
                                  "email",
                                  "officer@fidelitybank.com.gh",
                                );
                                loginForm.setValue("password", "password123");
                              }
                              toast.info(
                                `Switched to ${nextMode === "admin" ? "Admin" : "Organization"} mode`,
                              );
                            }
                          }}
                        >
                          {loginMode === "org"
                            ? "Sign in as Admin"
                            : "Sign in as Organization"}
                        </Button>
                      </div>
                    )}
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
                          Sign in to Portal
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                // 2FA form
                <form
                  onSubmit={twoFactorForm.handleSubmit(handle2FASubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      disabled={isLoading}
                      className="text-center text-2xl tracking-widest"
                      {...twoFactorForm.register("code")}
                    />
                    {twoFactorForm.formState.errors.code && (
                      <p className="text-sm text-destructive">
                        {twoFactorForm.formState.errors.code.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
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
                </form>
              )}
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <Link
                href="mailto:support@payswitch.com.gh"
                className="text-primary hover:underline"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
