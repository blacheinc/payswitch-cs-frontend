"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog";
import { TwoFactorSetupDialog } from "@/components/settings/two-factor-setup-dialog";
import { RemoveTwoFactorDialog } from "@/components/settings/remove-two-factor-dialog";

export function PersonalAccountTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authService.getMe(),
  });

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [removeTwoFactorOpen, setRemoveTwoFactorOpen] = useState(false);

  // Read enrollment from /auth/me; mirroring it in local state let the toggle
  // claim "off" while 2FA was active, offering the wizard again (VAPT §2.3).
  const profileLoaded = userProfile !== undefined;
  const twoFactorEnabled = userProfile?.totp_enabled ?? false;

  // Both dialogs change enrollment server-side — re-read, don't assume.
  const refreshProfile = () => {
    queryClient.invalidateQueries({ queryKey: ["auth-me"] });
  };

  const handleTwoFactorToggle = (checked: boolean) => {
    if (checked) {
      // Rebinding over an active factor goes through the disable flow, which
      // re-authenticates with password + current TOTP.
      if (twoFactorEnabled) return;
      setTwoFactorSetupOpen(true);
    } else {
      // Open remove dialog to disable 2FA
      setRemoveTwoFactorOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            This information is view-only. If you need to update your name or
            role, please contact your organization admin via the Teams page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input id="user-name" defaultValue={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email Address</Label>
              <Input
                id="user-email"
                defaultValue={user?.email || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Input
                id="user-role"
                defaultValue={user?.roleLabel || ""}
                disabled
                className="capitalize"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Update your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => setChangePasswordOpen(true)}>
            Change Password
          </Button>
          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleTwoFactorToggle}
              disabled={!profileLoaded}
              aria-label="Two-factor authentication"
            />
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      <TwoFactorSetupDialog
        open={twoFactorSetupOpen}
        onOpenChange={setTwoFactorSetupOpen}
        onEnabled={refreshProfile}
      />

      <RemoveTwoFactorDialog
        open={removeTwoFactorOpen}
        onOpenChange={setRemoveTwoFactorOpen}
        onDisabled={refreshProfile}
      />
    </div>
  );
}
