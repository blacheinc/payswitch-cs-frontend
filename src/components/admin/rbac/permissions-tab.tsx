"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";
import type { PermissionResponse } from "@/types/rbac-types";

function groupPermissions(permissions: PermissionResponse[]) {
  const groups: Record<string, PermissionResponse[]> = {};
  for (const p of permissions) {
    const key = p.group_name;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export function PermissionsTab() {
  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.ADMIN.ROLES_READ);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: RBAC_KEYS.permissions(),
    queryFn: () => rbacService.listPermissions(),
    enabled: canRead,
  });

  const permissions = data?.items ?? [];

  const q = search.toLowerCase();
  const filtered = search
    ? permissions.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.group_name.toLowerCase().includes(q),
      )
    : permissions;

  const grouped = groupPermissions(filtered);

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
        Failed to load permissions. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Read-only reference of all available permissions ({permissions.length}{" "}
          total)
        </p>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No permissions match your search.
        </div>
      )}

      {grouped.map(([groupName, groupPerms]) => (
        <Card key={groupName}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">{groupName}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {groupPerms.length}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {groupPerms[0]?.scope} scope
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>

                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Scope</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupPerms.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell>
                      <p className="text-sm font-medium">{permission?.name}</p>
                    </TableCell>

                    <TableCell className="text-sm text-muted-foreground">
                      {permission?.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {permission?.scope}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
