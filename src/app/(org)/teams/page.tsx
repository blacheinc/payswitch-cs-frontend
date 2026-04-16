"use client";

import { Users, ShieldCheck } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MembersTab } from "@/components/teams/members-tab";
import { OrgRolesTab } from "@/components/teams/org-roles-tab";

export default function TeamsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Manage your organization members, roles, and access levels
          </p>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="roles">
          <OrgRolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
