"use client";

import { format } from "date-fns";
import { Loader2, MoreVertical, Pencil, Trash2, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import type { RoleResponse } from "@/types/rbac-types";

interface RolesTableProps {
  roles: RoleResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEditRole: (role: RoleResponse) => void;
  onDeleteRole: (role: { id: string; name: string }) => void;
}

export function RolesTable({
  roles,
  isLoading,
  isError,
  onEditRole,
  onDeleteRole,
}: RolesTableProps) {
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
        Failed to load roles. Please try again.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Scope</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!roles || roles.length === 0 ? (
          <TableEmpty
            colSpan={5}
            title="No roles found"
            description="Create a custom role to get started."
          />
        ) : (
          roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.name}</span>
                  {role.is_system && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      <Lock className="mr-1 h-2.5 w-2.5" />
                      System
                    </Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role.description}
                  </p>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize text-xs">
                  {role.scope}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">
                  {role.permissions.length}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(role.created_at), "dd MMM yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditRole(role)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {role.is_system ? "View Role" : "Edit Role"}
                    </DropdownMenuItem>
                    {!role.is_system && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            onDeleteRole({ id: role.id, name: role.name })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Role
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
