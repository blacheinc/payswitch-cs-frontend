"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserPlus, Mail, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";
import type { OrgUserResponse } from "@/types/organization-type";

import { UserManagementTable } from "./user-management-table";
import { InviteUserModal } from "./invite-user-modal";
import { EditUserModal } from "./edit-user-modal";
import { SuspendUserModal } from "./suspend-user-modal";
import { ActivateUserModal } from "./activate-user-modal";
import { RemoveUserModal } from "./remove-user-modal";

export function MembersTab() {
  const [page, setPage] = useState(1);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OrgUserResponse | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [activateTarget, setActivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: USER_MGMT_KEYS.list({ page }),
    queryFn: () => userManagementService.list({ page }),
  });

  const users = data?.items ?? [];
  const totalUsers = data?.total ?? 0;
  const invitedCount = users.filter(
    (u) => u.status === "invited" || u.status === "pending",
  ).length;
  const adminCount = users.filter((u) => u.roleLabel === "admin").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage your organization members and their access levels
        </p>
        <Button size="sm" onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">Active now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invites
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : invitedCount}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-12" /> : adminCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access privileges
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Members</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <UserManagementTable
            data={data}
            isLoading={isLoading}
            isError={isError}
            page={page}
            onPageChange={setPage}
            onEditUser={setEditTarget}
            onSuspendUser={setSuspendTarget}
            onActivateUser={setActivateTarget}
            onRemoveUser={setRemoveTarget}
          />
        </CardContent>
      </Card>

      <InviteUserModal open={isInviteOpen} onOpenChange={setIsInviteOpen} />
      <EditUserModal
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        user={editTarget}
      />
      <SuspendUserModal
        open={!!suspendTarget}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
        userId={suspendTarget?.id ?? null}
        userName={suspendTarget?.name ?? ""}
      />
      <ActivateUserModal
        open={!!activateTarget}
        onOpenChange={(open) => {
          if (!open) setActivateTarget(null);
        }}
        userId={activateTarget?.id ?? null}
        userName={activateTarget?.name ?? ""}
      />
      <RemoveUserModal
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        userId={removeTarget?.id ?? null}
        userName={removeTarget?.name ?? ""}
      />
    </div>
  );
}
