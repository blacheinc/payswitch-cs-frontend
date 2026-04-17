"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { PermissionCode } from "@/lib/constant";

/**
 * Client-side RBAC from the **signed-in user's** resolved permission list.
 *
 * That list comes from `GET /auth/me` → `permissions` (stored on `user.permissions`
 * in session after login and after session init refresh). It is **not** the catalog
 * from `GET /v1/permissions`.
 *
 * If `permissions` contains `"*"`, the principal is treated as super-admin and
 * `can()` returns true for every code (per API docs for GET /auth/me/permissions).
 */
export function usePermissions() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const isMockUser =
    typeof user?.id === "string" && user.id.startsWith("mock-");

  const permissionSet = useMemo(() => {
    const list = user?.permissions;
    if (!list?.length) return new Set<string>();
    return new Set(list);
  }, [user?.permissions]);

  const can = useMemo(() => {
    return (code: PermissionCode) => {
      if (isMockUser) return true;
      if (permissionSet.has("*")) return true;
      return permissionSet.has(code);
    };
  }, [isMockUser, permissionSet]);

  const isLoading =
    authLoading ||
    (isAuthenticated && !isMockUser && user?.permissions === undefined);

  return {
    permissions: permissionSet,
    can,
    isLoading,
    isError: false,
  };
}
