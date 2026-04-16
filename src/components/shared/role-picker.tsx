"use client";

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

import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";

interface RolePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  description?: string;
  /** Placeholder shown when no role is selected */
  placeholder?: string;
}

const NONE_VALUE = "__none__";

/**
 * Reusable RBAC role dropdown that fetches available roles.
 * Returns the role UUID via `onValueChange`, or empty string when "None" is selected.
 */
export function RolePicker({
  value,
  onValueChange,
  label = "RBAC Role",
  description,
  placeholder = "System default",
}: RolePickerProps) {
  const { data, isLoading } = useQuery({
    queryKey: RBAC_KEYS.roles(),
    queryFn: () => rbacService.listRoles(),
  });

  const roles = data?.items ?? [];

  const handleChange = (v: string) => {
    onValueChange(v === NONE_VALUE ? "" : v);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {isLoading ? (
        <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roles…
        </div>
      ) : (
        <Select value={value || NONE_VALUE} onValueChange={handleChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>
              <span className="text-muted-foreground">None (system default)</span>
            </SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{role.name}</span>
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
