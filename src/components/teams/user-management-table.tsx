"use client";

import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Loader2,
  MoreVertical,
  Shield,
  ShieldOff,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import type { OrgUserResponse } from "@/types/organization-type";
import type { PaginatedResponse } from "@/types/api-type";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  credit_officer: "Credit Officer",
  developer: "Developer",
  viewer: "Viewer",
};

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
                    {user.roleLabel === "admin" && (
                      <Shield className="h-3 w-3 text-primary" />
                    )}
                    <span className="capitalize">
                      {ROLE_LABELS[user.roleLabel] ||
                        user.roleLabel.replace("_", " ")}
                    </span>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditUser(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      {user.status === "active" && (
                        <DropdownMenuItem
                          onClick={() =>
                            onSuspendUser({ id: user.id, name: user.name })
                          }
                        >
                          <ShieldOff className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                      {(user.status === "suspended" ||
                        user.status === "inactive") && (
                        <DropdownMenuItem
                          onClick={() =>
                            onActivateUser({ id: user.id, name: user.name })
                          }
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({data?.total ?? 0} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
