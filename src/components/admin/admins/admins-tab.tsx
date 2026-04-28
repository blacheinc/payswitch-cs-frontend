"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Shield, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  adminManagementService,
  ADMIN_MGMT_KEYS,
} from "@/lib/admin-management-service";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSION_CODES, PLATFORM_SYSTEM_ROLES } from "@/lib/constant";
import type { AdminMember } from "@/types/admin-management-type";

import { AdminsTable } from "./admins-table";
import { InviteAdminModal } from "./invite-admin-modal";
import { EditAdminModal } from "./edit-admin-modal";
import { SuspendAdminModal } from "./suspend-admin-modal";
import { ActivateAdminModal } from "./activate-admin-modal";
import { RemoveAdminModal } from "./remove-admin-modal";

export function AdminsTab() {
  const { can } = usePermissions();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminMember | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminMember | null>(null);
  const [activateTarget, setActivateTarget] = useState<AdminMember | null>(
    null,
  );
  const [removeTarget, setRemoveTarget] = useState<AdminMember | null>(null);

  const canList = can(PERMISSION_CODES.ADMIN.ADMINS_LIST);
  const canInvite = can(PERMISSION_CODES.ADMIN.ADMINS_INVITE);
  const canUpdate = can(PERMISSION_CODES.ADMIN.ADMINS_UPDATE);
  const canSuspend = can(PERMISSION_CODES.ADMIN.ADMINS_SUSPEND);
  const canDelete = can(PERMISSION_CODES.ADMIN.ADMINS_DELETE);

  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_MGMT_KEYS.list({ page, perPage }),
    queryFn: () => adminManagementService.list({ page, perPage }),
    enabled: canList,
  });

  const admins = useMemo(() => data?.items ?? [], [data?.items]);

  // Stats + "last active SUPER_ADMIN" guard-rail.
  const { totalAdmins, superAdminCount, deactivatedCount, lastSuperAdminId } =
    useMemo(() => {
      const activeSupers = admins.filter(
        (a) =>
          a.status === "active" &&
          a.roleName === PLATFORM_SYSTEM_ROLES.SUPER_ADMIN.name,
      );
      return {
        totalAdmins: data?.total ?? admins.length,
        superAdminCount: activeSupers.length,
        deactivatedCount: admins.filter((a) => a.status === "deactivated")
          .length,
        lastSuperAdminId:
          activeSupers.length === 1 ? activeSupers[0]!.id : null,
      };
    }, [admins, data?.total]);

  const isLastSuperAdminId = (adminId: string) =>
    lastSuperAdminId === adminId;

  if (!canList) {
    return (
      <div className="rounded-md border bg-muted/30 px-4 py-6 text-center">
        <Shield className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm font-medium">
          You don&apos;t have permission to view administrators.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Contact a Super Admin to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage platform administrators and the roles that gate their access.
        </p>
        {canInvite && (
          <Button size="sm" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Administrator
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total administrators
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : totalAdmins}
            </div>
            <p className="text-xs text-muted-foreground">
              across all platform roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : superAdminCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {superAdminCount === 1
                ? "only one active — promote another before removing"
                : "active break-glass tier"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deactivated</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                deactivatedCount
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              access revoked · audit trail preserved
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Administrators</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <AdminsTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={(n) => {
              setPerPage(n);
              setPage(1);
            }}
            onEdit={setEditTarget}
            onSuspend={setSuspendTarget}
            onActivate={setActivateTarget}
            onRemove={setRemoveTarget}
            currentAdminId={user?.id ?? null}
            isLastSuperAdminId={isLastSuperAdminId}
            canUpdate={canUpdate}
            canSuspend={canSuspend}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      <InviteAdminModal open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      <EditAdminModal
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        admin={editTarget}
        lockRole={
          !!editTarget && isLastSuperAdminId(editTarget.id)
        }
      />
      <SuspendAdminModal
        open={!!suspendTarget}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
        adminId={suspendTarget?.id ?? null}
        adminName={suspendTarget?.name ?? ""}
      />
      <ActivateAdminModal
        open={!!activateTarget}
        onOpenChange={(open) => {
          if (!open) setActivateTarget(null);
        }}
        adminId={activateTarget?.id ?? null}
        adminName={activateTarget?.name ?? ""}
      />
      <RemoveAdminModal
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        adminId={removeTarget?.id ?? null}
        adminName={removeTarget?.name ?? ""}
      />
    </div>
  );
}
