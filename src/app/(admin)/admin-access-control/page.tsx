"use client";

import { List, ShieldCheck, Users } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AdminsTab } from "@/components/admin/admins/admins-tab";
import { RolesTab } from "@/components/admin/rbac/roles-tab";
import { PermissionsTab } from "@/components/admin/rbac/permissions-tab";
import { NoPermission } from "@/components/shared/no-permission";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";

export default function AccessControlPage() {
  const { can } = usePermissions();
  const canListAdmins = can(PERMISSION_CODES.ADMIN.ADMINS_LIST);
  const canReadRoles = can(PERMISSION_CODES.ADMIN.ROLES_READ);

  const defaultTab = canListAdmins
    ? "admins"
    : canReadRoles
      ? "roles"
      : "permissions";

  if (!canListAdmins && !canReadRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Access Control</h1>
          <p className="text-muted-foreground">
            Manage platform administrators, their roles, and the permissions
            registry.
          </p>
        </div>
        <NoPermission />
      </div>
    );
  }

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

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          {canListAdmins && (
            <TabsTrigger value="admins">
              <Users className="mr-2 h-4 w-4" />
              Admins
            </TabsTrigger>
          )}
          {canReadRoles && (
            <TabsTrigger value="roles">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Roles
            </TabsTrigger>
          )}
          {canReadRoles && (
            <TabsTrigger value="permissions">
              <List className="mr-2 h-4 w-4" />
              Permissions
            </TabsTrigger>
          )}
        </TabsList>

        {canListAdmins && (
          <TabsContent value="admins">
            <AdminsTab />
          </TabsContent>
        )}

        {canReadRoles && (
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
        )}

        {canReadRoles && (
          <TabsContent value="permissions">
            <PermissionsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
