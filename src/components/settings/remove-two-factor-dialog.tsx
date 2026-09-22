"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { authService } from "@/lib/auth-service";
import type { ApiError } from "@/types/models";
import {
  removeTwoFactorSchema,
  type RemoveTwoFactorValues,
} from "@/lib/schemas/settings-management";

interface RemoveTwoFactorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDisabled: () => void;
}

export function RemoveTwoFactorDialog({
  open,
  onOpenChange,
  onDisabled,
}: RemoveTwoFactorDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RemoveTwoFactorValues>({
    resolver: zodResolver(removeTwoFactorSchema),
    defaultValues: { password: "", code: "" },
    mode: "onTouched",
  });

  const resetState = () => {
    form.reset({ password: "", code: "" });
    setShowPassword(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  const removeMutation = useMutation({
    mutationFn: (values: RemoveTwoFactorValues) => authService.remove2FA(values),
    onSuccess: () => {
      handleOpenChange(false);
      onDisabled();
      toast.success("Two-factor authentication disabled successfully");
    },
    onError: (error: ApiError) => {
      // Attach the failure to the field that caused it rather than a toast
      // that makes the user guess which of the two was wrong.
      if (error?.reauthReason === "bad_password") {
        form.setError("password", { message: "Incorrect password." });
        return;
      }
      if (error?.reauthReason === "bad_totp_code") {
        form.setError("code", {
          message: "That code isn't valid. Check your authenticator and retry.",
        });
        return;
      }
      toast.error(
        error?.message ||
          "Failed to disable 2FA. Please verify your password and code.",
      );
    },
  });

  const handleRemove = (values: RemoveTwoFactorValues) => {
    removeMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to disable 2FA? This will make your account
            less secure. Please enter your password and a 2FA code to confirm.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleRemove)}
          className="space-y-4 py-4"
          noValidate
        >
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel htmlFor="password" required>
                  Current Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    aria-invalid={fieldState.invalid}
                    disabled={removeMutation.isPending}
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={removeMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="code"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>Authenticator Code</FieldLabel>
                <div className="pt-2">
                  <InputOTP
                    maxLength={6}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={removeMutation.isPending}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={removeMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={removeMutation.isPending}>
              {removeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disable 2FA
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
