"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";
import type { PermissionResponse } from "@/types/rbac-types";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function groupPermissions(permissions: PermissionResponse[]) {
  const groups: Record<string, PermissionResponse[]> = {};
  for (const p of permissions) {
    const key = p.group_name;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export function CreateRoleModal({ open, onOpenChange }: CreateRoleModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  const { data: permissionsData } = useQuery({
    queryKey: RBAC_KEYS.permissions(),
    queryFn: () => rbacService.listPermissions(),
    enabled: open,
  });

  const permissions = permissionsData?.items ?? [];
  const grouped = groupPermissions(permissions);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedCodes(new Set());
  };

  const createMutation = useMutation({
    mutationFn: rbacService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RBAC_KEYS.all });
      onOpenChange(false);
      resetForm();
      toast.success(`Role "${name}" created successfully`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "Failed to create role");
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
      permission_codes: Array.from(selectedCodes),
    });
  };

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleGroup = (groupPerms: PermissionResponse[]) => {
    const codes = groupPerms.map((p) => p.code);
    const allSelected = codes.every((c) => selectedCodes.has(c));
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      for (const c of codes) {
        if (allSelected) next.delete(c);
        else next.add(c);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
          <DialogDescription>
            Define a new custom role and assign permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Credit Analyst"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional role description"
                maxLength={300}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              {selectedCodes.size > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedCodes.size} selected
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-md p-3">
              <div className="space-y-4">
                {grouped.map(([groupName, groupPerms]) => {
                  const codes = groupPerms.map((p) => p.code);
                  const allSelected = codes.every((c) =>
                    selectedCodes.has(c),
                  );
                  const someSelected =
                    !allSelected && codes.some((c) => selectedCodes.has(c));

                  return (
                    <div key={groupName} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={
                            allSelected
                              ? true
                              : someSelected
                                ? "indeterminate"
                                : false
                          }
                          onCheckedChange={() => toggleGroup(groupPerms)}
                        />
                        <span className="text-sm font-semibold">
                          {groupName}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {groupPerms.length}
                        </Badge>
                      </div>
                      <div className="ml-6 space-y-1.5">
                        {groupPerms.map((p) => (
                          <div
                            key={p.code}
                            className="flex items-start gap-2"
                          >
                            <Checkbox
                              checked={selectedCodes.has(p.code)}
                              onCheckedChange={() => toggleCode(p.code)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="text-sm">{p.code}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
