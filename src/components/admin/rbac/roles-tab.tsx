"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";
import type { RoleResponse } from "@/types/rbac-types";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";

import { RolesTable } from "./roles-table";
import { CreateRoleModal } from "./create-role-modal";
import { EditRoleModal } from "./edit-role-modal";
import { DeleteRoleModal } from "./delete-role-modal";

export function RolesTab() {
  const { can } = usePermissions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: RBAC_KEYS.roles(),
    queryFn: () => rbacService.listRoles(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage custom roles and their permission assignments
        </p>
        {can(PERMISSION_CODES.ADMIN.ROLES_MANAGE) && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          <RolesTable
            roles={data?.items}
            isLoading={isLoading}
            isError={isError}
            onEditRole={setEditTarget}
            onDeleteRole={setDeleteTarget}
          />
        </CardContent>
      </Card>

      <CreateRoleModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <EditRoleModal
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        role={editTarget}
      />

      <DeleteRoleModal
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        roleId={deleteTarget?.id ?? null}
        roleName={deleteTarget?.name ?? ""}
      />
    </div>
  );
}
