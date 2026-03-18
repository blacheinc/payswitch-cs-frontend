"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShieldOff, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { authService } from "@/lib/auth-service";

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
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetState = () => {
    setPassword("");
    setCode("");
    setShowPassword(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  const removeMutation = useMutation({
    mutationFn: () => authService.remove2FA({ password, code }),
    onSuccess: () => {
      handleOpenChange(false);
      onDisabled();
      toast.success("Two-factor authentication disabled successfully");
    },
    onError: (error) => {
      toast.error(
        error?.message ||
          "Failed to disable 2FA. Please verify your password and code.",
      );
    },
  });

  const handleRemove = () => {
    if (!password) {
      toast.error("Please enter your current password");
      return;
    }
    if (!code || code.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    removeMutation.mutate();
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

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Current Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={removeMutation.isPending}
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
          </div>

          <div className="space-y-2">
            <Label>Authenticator Code</Label>
            <div className="pt-2">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
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
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={removeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={
              removeMutation.isPending || !password || code.length !== 6
            }
          >
            {removeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Disable 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
