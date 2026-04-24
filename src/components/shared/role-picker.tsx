"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { rbacService, RBAC_KEYS, type RoleScope } from "@/lib/rbac-service";
import { prettyPlatformRoleName } from "@/lib/constant";
import type { RoleResponse } from "@/types/rbac-types";

interface RolePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  onRoleChange?: (role: RoleResponse | null) => void;
  /** Omit or pass empty string to hide the built-in label (use with shadcn FormLabel). */
  label?: string;
  description?: string;
  /** Placeholder shown when no role is selected */
  placeholder?: string;
  /**
   * When false, omits “None” and expects a concrete role id (e.g. org invites).
   * @default true
   */
  allowNone?: boolean;
  /**
   * Restrict the fetched roles by scope. Platform-admin forms should pass
   * `"platform"`; org-side forms can omit it (the backend filters by the
   * caller's audience).
   */
  scope?: RoleScope;
}

const NONE_VALUE = "__none__";

/**
 * Reusable RBAC role dropdown that fetches available roles.
 * Returns the role UUID via `onValueChange`, or empty string when "None" is selected.
 */
export function RolePicker({
  value,
  onValueChange,
  onRoleChange,
  label = "RBAC Role",
  description,
  placeholder = "System default",
  allowNone = true,
  scope,
}: RolePickerProps) {
  const { data, isLoading } = useQuery({
    queryKey: RBAC_KEYS.roles(scope),
    queryFn: () => rbacService.listRoles(scope),
  });

  const roles = data?.items ?? [];
  const showNone = allowNone !== false;

  useEffect(() => {
    if (isLoading || showNone || roles.length === 0 || value) return;
    const first = roles[0]!;
    onValueChange(first.id);
    onRoleChange?.(first);
  }, [isLoading, showNone, roles, value, onValueChange, onRoleChange]);

  const handleChange = (v: string) => {
    const normalized = v === NONE_VALUE ? "" : v;
    onValueChange(normalized);
    onRoleChange?.(roles.find((role) => role.id === normalized) ?? null);
  };

  const selectValue = showNone
    ? value || NONE_VALUE
    : value || roles[0]?.id || "";

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {isLoading ? (
        <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roles…
        </div>
      ) : roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No roles available. Create a role under Team → Roles first.
        </p>
      ) : (
        <Select value={selectValue} onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {showNone && (
              <SelectItem value={NONE_VALUE}>
                <span className="text-muted-foreground">
                  None (system default)
                </span>
              </SelectItem>
            )}
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    {prettyPlatformRoleName(role.name)}
                    {role.is_system && (
                      <span className="ml-2 text-[10px] font-medium text-muted-foreground align-middle">
                        system
                      </span>
                    )}
                  </span>
                  {role.description && (
                    <span className="text-xs text-muted-foreground">
                      {role.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
