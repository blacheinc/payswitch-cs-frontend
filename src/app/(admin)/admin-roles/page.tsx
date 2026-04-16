"use client";

import { ShieldCheck, List } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { RolesTab } from "@/components/admin/rbac/roles-tab";
import { PermissionsTab } from "@/components/admin/rbac/permissions-tab";

export default function AdminRolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Manage platform roles and view the permissions registry
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="roles">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <List className="mr-2 h-4 w-4" />
            Permissions
          </TabsTrigger>
        </TabsList>

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
