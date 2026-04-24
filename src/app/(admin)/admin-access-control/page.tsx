"use client";

import { List, ShieldCheck, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdminsTab } from "@/components/admin/admins/admins-tab";
import { RolesTab } from "@/components/admin/rbac/roles-tab";
import { PermissionsTab } from "@/components/admin/rbac/permissions-tab";

export default function AccessControlPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Access Control</h1>
          <p className="text-muted-foreground">
            Manage platform administrators, their roles, and the permissions
            registry.
          </p>
        </div>
      </div>

      <Tabs defaultValue="admins" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="admins">
            <Users className="mr-2 h-4 w-4" />
            Admins
          </TabsTrigger>
          <TabsTrigger value="roles">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <List className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <AdminsTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
