"use client";

import { Building2, User } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgProfileTab } from "@/components/settings/org-profile-tab";
import { PersonalAccountTab } from "@/components/settings/personal-account-tab";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization profile and account preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          {" "}
          <TabsTrigger value="account">
            <User className="w-4 h-4 mr-2" />
            Personal Account
          </TabsTrigger>
          <TabsTrigger value="profile">
            <Building2 className="w-4 h-4 mr-2" />
            Organization Profile
          </TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="space-y-6">
          <PersonalAccountTab />
        </TabsContent>
        <TabsContent value="profile" className="space-y-6">
          <OrgProfileTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
