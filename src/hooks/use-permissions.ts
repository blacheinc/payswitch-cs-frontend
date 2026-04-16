"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";

/**
 * Fetches the authenticated user's resolved permissions and provides
 * a `can(code)` helper for client-side UI gating.
 *
 * Permissions are cached and only fetched when the user is authenticated.
 * The set refreshes on window focus (React Query default) and can be
 * manually invalidated via `queryClient.invalidateQueries({ queryKey: RBAC_KEYS.permissions() })`.
 */
export function usePermissions() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data,
    isLoading: permissionsLoading,
    isError,
  } = useQuery({
    queryKey: RBAC_KEYS.permissions(),
    queryFn: () => rbacService.listPermissions(),
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  const permissionSet = useMemo(() => {
    if (!data?.items) return new Set<string>();
    return new Set(data.items.map((p) => p.code));
  }, [data]);

  const can = useMemo(
    () => (code: string) => permissionSet.has(code),
    [permissionSet],
  );

  return {
    permissions: permissionSet,
    can,
    isLoading: authLoading || permissionsLoading,
    isError,
  };
}
