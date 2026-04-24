"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save, Globe, Shield } from "lucide-react";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordDialog } from "@/components/settings/change-password-dialog";
import { TwoFactorSetupDialog } from "@/components/settings/two-factor-setup-dialog";
import { RemoveTwoFactorDialog } from "@/components/settings/remove-two-factor-dialog";

export default function AdminSettingsPage() {
  const { data: userProfile } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authService.getMe(),
  });

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [removeTwoFactorOpen, setRemoveTwoFactorOpen] = useState(false);

  useEffect(() => {
    if (userProfile !== undefined) {
      setTwoFactorEnabled(userProfile.totp_enabled);
    }
  }, [userProfile]);

  const handleTwoFactorToggle = (checked: boolean) => {
    if (checked) {
      setTwoFactorSetupOpen(true);
    } else {
      setRemoveTwoFactorOpen(true);
    }
  };

  const handleSave = () => {
    toast.success("System settings updated successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Global configuration for the PaySwitch Credit Scoring Platform
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Personal Security</CardTitle>
            </div>
            <CardDescription>
              Manage your password and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handleTwoFactorToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* General Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>General Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Platform Name</Label>
              <Input defaultValue="PaySwitch Credit Scoring" />
            </div>
            <div className="grid gap-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@payswitch.com.gh" />
            </div>
            <div className="grid gap-2">
              <Label>Terms of Service URL</Label>
              <Input defaultValue="https://payswitch.com.gh/terms" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      <TwoFactorSetupDialog
        open={twoFactorSetupOpen}
        onOpenChange={setTwoFactorSetupOpen}
        onEnabled={() => setTwoFactorEnabled(true)}
      />

      <RemoveTwoFactorDialog
        open={removeTwoFactorOpen}
        onOpenChange={setRemoveTwoFactorOpen}
        onDisabled={() => setTwoFactorEnabled(false)}
      />
    </div>
  );
}
