"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Edit,
  MoreVertical,
  Shield,
  ShieldOff,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { OrgUserResponse } from "@/types/organization-type";
import type { PaginatedResponse } from "@/types/api-type";
import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";

function formatLegacyRoleLabel(label: string): string {
  return label.replace(/_/g, " ");
}

interface UserManagementTableProps {
  data: PaginatedResponse<OrgUserResponse> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onEditUser: (user: OrgUserResponse) => void;
  onSuspendUser: (user: { id: string; name: string }) => void;
  onActivateUser: (user: { id: string; name: string }) => void;
  onRemoveUser: (user: { id: string; name: string }) => void;
}

export function UserManagementTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  onEditUser,
  onSuspendUser,
  onActivateUser,
  onRemoveUser,
}: UserManagementTableProps) {
  const users = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const { can } = usePermissions();
  const canUpdate = can(PERMISSION_CODES.USERS.UPDATE);
  const canSuspend = can(PERMISSION_CODES.USERS.SUSPEND);
  const canDelete = can(PERMISSION_CODES.USERS.DELETE);

  const { data: rolesData } = useQuery({
    queryKey: RBAC_KEYS.roles(),
    queryFn: () => rbacService.listRoles(),
  });

  const roleNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rolesData?.items ?? []) {
      m.set(r.id, r.name);
    }
    return m;
  }, [rolesData?.items]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "inactive":
        return <Badge variant="destructive">Inactive</Badge>;
      case "invited":
      case "pending":
        return (
          <Badge variant="warning" className="capitalize">
            Invited
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  const getRoleDisplay = (user: OrgUserResponse) => {
    const rbacName =
      user.roleId && roleNameById.has(user.roleId)
        ? roleNameById.get(user.roleId)
        : undefined;
    return rbacName ?? formatLegacyRoleLabel(user.roleLabel);
  };

  const isAdminDisplay = (user: OrgUserResponse) => {
    if (user.roleLabel === "admin") return true;
    const n = user.roleId ? roleNameById.get(user.roleId) : undefined;
    return n?.trim().toLowerCase() === "admin";
  };

  if (isLoading) {
    return (
      <TableSkeleton
        headers={["User", "Role", "Status", "Last Active", "Date Added", ""]}
      />
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load users. Please try again.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title="No members found"
              description="There are no members to display. Invite someone to get started."
            />
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isAdminDisplay(user) && (
                      <Shield className="h-3 w-3 text-primary" />
                    )}
                    <span className="capitalize">{getRoleDisplay(user)}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastLoginAt
                    ? format(new Date(user.lastLoginAt), "MMM d, yyyy h:mm a")
                    : "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(user.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  {canUpdate || canSuspend || canDelete ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canUpdate && (
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                        )}
                        {canSuspend && user.status === "active" && (
                          <DropdownMenuItem
                            onClick={() =>
                              onSuspendUser({ id: user.id, name: user.name })
                            }
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Suspend
                          </DropdownMenuItem>
                        )}
                        {canSuspend &&
                          (user.status === "suspended" ||
                            user.status === "inactive") && (
                            <DropdownMenuItem
                              onClick={() =>
                                onActivateUser({
                                  id: user.id,
                                  name: user.name,
                                })
                              }
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                onRemoveUser({ id: user.id, name: user.name })
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <TablePagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        onPageChange={onPageChange}
      />
    </>
  );
}
