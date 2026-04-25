"use client";

import {
  Edit,
  Loader2,
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldOff,
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
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { AdminMember } from "@/types/admin-management-type";
import type { PaginatedResponse } from "@/types/api-type";
import { formatDate, cn } from "@/lib/utils";
import { prettyPlatformRoleName, PLATFORM_SYSTEM_ROLES } from "@/lib/constant";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "deactivated":
      return <Badge variant="destructive">Deactivated</Badge>;
    default:
      return (
        <Badge variant="warning" className="capitalize">
          {status}
        </Badge>
      );
  }
}

interface AdminsTableProps {
  data: PaginatedResponse<AdminMember> | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (admin: AdminMember) => void;
  onSuspend: (admin: AdminMember) => void;
  onActivate: (admin: AdminMember) => void;
  onRemove: (admin: AdminMember) => void;
  /** ID of the currently logged-in admin. Used to hide self-actions. */
  currentAdminId?: string | null;
  /** True when this row is the only active SUPER_ADMIN — disables destructive actions. */
  isLastSuperAdminId?: (adminId: string) => boolean;
  /** Permission gates — passed in so the tab owns permission logic. */
  canUpdate: boolean;
  canSuspend: boolean;
  canDelete: boolean;
}

export function AdminsTable({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  onEdit,
  onSuspend,
  onActivate,
  onRemove,
  currentAdminId,
  isLastSuperAdminId,
  canUpdate,
  canSuspend,
  canDelete,
}: AdminsTableProps) {
  const admins = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load admins. Please try again.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Administrator</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title="No administrators found"
              description="Invite your first platform administrator to get started."
            />
          ) : (
            admins.map((admin) => {
              const isSelf = !!currentAdminId && admin.id === currentAdminId;
              const isSuperAdmin =
                admin.roleName === PLATFORM_SYSTEM_ROLES.SUPER_ADMIN.name;
              const isLastSuper = isLastSuperAdminId?.(admin.id) ?? false;
              const hasAnyAction =
                canUpdate ||
                (canSuspend && !isSelf) ||
                (canDelete && !isSelf);

              return (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {getInitials(admin.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1.5">
                          {admin.name}
                          {isSelf && (
                            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              you
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {admin.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isSuperAdmin && (
                        <Shield className="h-3 w-3 text-primary" />
                      )}
                      <span
                        className={cn(
                          !admin.roleName && "text-muted-foreground italic",
                        )}
                      >
                        {prettyPlatformRoleName(admin.roleName)}
                      </span>
                      {isLastSuper && (
                        <Badge variant="outline" className="text-[10px] ml-1">
                          last super admin
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(admin.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(admin.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {hasAnyAction ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdate && (
                            <DropdownMenuItem onClick={() => onEdit(admin)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canSuspend && !isSelf && admin.status === "active" && (
                            <DropdownMenuItem
                              onClick={() => onSuspend(admin)}
                              disabled={isLastSuper}
                            >
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {canSuspend &&
                            !isSelf &&
                            admin.status === "deactivated" && (
                              <DropdownMenuItem
                                onClick={() => onActivate(admin)}
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          {canDelete && !isSelf && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onRemove(admin)}
                                disabled={isLastSuper}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
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
              );
            })
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
