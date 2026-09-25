"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PermissionCode } from "@/lib/constant";

// The permission set is resolved SERVER-side from the HttpOnly session cookie
// and handed to this provider by the portal layouts. It is never read from a
// login/me response body or localStorage, so tampering with those changes
// nothing about what renders (VAPT §2.8).
//
// This remains a display hint, not a security boundary: the server enforces
// every action regardless of what the UI draws.

const PermissionsContext = createContext<ReadonlySet<string>>(new Set());

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  const value = useMemo(() => new Set(permissions), [permissions]);
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Client-side RBAC for rendering. `"*"` is super-admin and satisfies every code.
 */
export function usePermissions() {
  const permissionSet = useContext(PermissionsContext);

  const can = useMemo(
    () => (code: PermissionCode) =>
      permissionSet.has("*") || permissionSet.has(code),
    [permissionSet],
  );

  return {
    permissions: permissionSet,
    can,
    // Resolved before first paint by the server layout — nothing to wait for.
    isLoading: false,
    isError: false,
  };
}
