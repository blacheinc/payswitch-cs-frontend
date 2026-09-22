"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/auth-service";
import type { ApiError } from "@/types/models";
import {
  twoFactorVerifySchema,
  type TwoFactorVerifyValues,
} from "@/lib/schemas/settings-management";

interface TwoFactorSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
}

type Step = "setup" | "verify";

export function TwoFactorSetupDialog({
  open,
  onOpenChange,
  onEnabled,
}: TwoFactorSetupDialogProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("setup");
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [copied, setCopied] = useState(false);
  const form = useForm<TwoFactorVerifyValues>({
    resolver: zodResolver(twoFactorVerifySchema),
    defaultValues: { code: "" },
    mode: "onTouched",
  });

  const resetState = () => {
    setStep("setup");
    setSecret("");
    setUri("");
    setTempToken("");
    form.reset({ code: "" });
    setCopied(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  // Step 1: Call /auth/2fa/setup to get secret + QR URI
  const setupMutation = useMutation({
    mutationFn: authService.setup2FA,
    onSuccess: (data) => {
      setSecret(data?.secret);
      setUri(data?.uri);
      setTempToken(data?.tempToken);
      setStep("verify");
    },
    onError: (error: ApiError) => {
      // 2FA was enabled elsewhere (another tab, another device) while this
      // page still believed it was off. Re-read the profile so the toggle
      // corrects itself, and point the user at the disable flow.
      if (error?.reauthReason === "2fa_already_enabled") {
        queryClient.invalidateQueries({ queryKey: ["auth-me"] });
        handleOpenChange(false);
        toast.error(
          "Two-factor authentication is already enabled. Disable it first to enroll a new authenticator.",
        );
        return;
      }
      toast.error(error?.message || "Failed to set up 2FA");
    },
  });

  // Step 2: Verify the code the user enters using the temporary token.
  const verifyMutation = useMutation({
    mutationFn: (values: TwoFactorVerifyValues) =>
      authService.verify2FA({ code: values.code, tempToken }),
    onSuccess: (data) => {
      handleOpenChange(false);
      onEnabled();
      toast.success(
        data?.message || "Two-factor authentication enabled successfully",
      );
    },
    onError: (error: ApiError) => {
      if (error?.reauthReason === "bad_totp_code") {
        form.setError("code", {
          message: "That code isn't valid. Check your authenticator and retry.",
        });
        return;
      }
      toast.error(
        error?.message || "Invalid verification code. Please try again.",
      );
    },
  });

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success("Secret key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleVerify = (values: TwoFactorVerifyValues) => {
    verifyMutation.mutate(values);
  };

  const isPending = setupMutation.isPending || verifyMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "setup"
              ? "Enable Two-Factor Authentication"
              : "Verify Authenticator"}
          </DialogTitle>
          <DialogDescription>
            {step === "setup"
              ? "Add an extra layer of security to your account using a TOTP authenticator app."
              : "Scan the QR code with your authenticator app, then enter the 6-digit code to verify."}
          </DialogDescription>
        </DialogHeader>

        {step === "setup" ? (
          // Step 1: Explain + start setup
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="text-sm font-medium">Before you begin</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  Install an authenticator app like{" "}
                  <strong>Google Authenticator</strong> or{" "}
                  <strong>Authy</strong> on your phone.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  You&apos;ll scan a QR code to link your account.
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  Enter the 6-digit code to confirm setup.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          // Step 2: Show QR + secret + code input
          <div className="space-y-4 py-4">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="rounded-lg border bg-white p-4">
                <QRCodeSVG value={uri} size={180} level="M" />
              </div>
            </div>

            <Separator />

            {/* Manual entry key */}
            <div className="space-y-2">
              <FieldLabel className="text-xs text-muted-foreground">
                Can&apos;t scan? Enter this key manually:
              </FieldLabel>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm font-mono break-all">
                  {secret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Verification code input */}
            <form onSubmit={form.handleSubmit(handleVerify)} noValidate>
              <Controller
                name="code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel required>Verification Code</FieldLabel>
                    <div className="flex">
                      <InputOTP
                        maxLength={6}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <FieldDescription>
                      Enter the 6-digit code from your authenticator app.
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </form>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          {step === "setup" ? (
            <Button
              onClick={() => setupMutation.mutate()}
              disabled={setupMutation.isPending}
            >
              {setupMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Get Started
            </Button>
          ) : (
            <Button
              onClick={() => form.handleSubmit(handleVerify)()}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify &amp; Enable
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
