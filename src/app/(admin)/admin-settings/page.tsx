"use client";

import { useState } from "react";
import { Save, Shield, Globe, Bell, Mail } from "lucide-react";
import { toast } from "sonner";

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

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [publicSignup, setPublicSignup] = useState(false);

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
        {/* <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
               <Shield className="h-5 w-5 text-primary" />
               <CardTitle>System Controls</CardTitle>
            </div>
            <CardDescription>Critical platform-wide switches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                   <Label className="text-base">Maintenance Mode</Label>
                   <p className="text-sm text-muted-foreground">
                     Disable access for all non-admin users. Useful during upgrades.
                   </p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
             </div>
             <Separator />
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                   <Label className="text-base">Public Organization Signup</Label>
                   <p className="text-sm text-muted-foreground">
                     Allow new organizations to self-register via the landing page.
                   </p>
                </div>
                <Switch checked={publicSignup} onCheckedChange={setPublicSignup} />
             </div>
          </CardContent>
        </Card> */}

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
    </div>
  );
}
