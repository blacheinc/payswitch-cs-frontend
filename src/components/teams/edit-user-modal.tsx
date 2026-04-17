"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import {
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";
import type { OrgUserResponse } from "@/types/organization-type";
import { RolePicker } from "@/components/shared/role-picker";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: OrgUserResponse | null;
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
}: EditUserModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRoleId(user.roleId ?? "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof userManagementService.update>[1];
    }) => userManagementService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      toast.success("User updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update user");
    },
  });

  const handleSubmit = () => {
    if (!user) return;
    updateMutation.mutate({
      id: user.id,
      data: {
        name: name || null,
        roleId: roleId || null,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update details for {user?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              User Details
            </h3>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-name"
                  className="pl-8"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Role
            </h3>
            <RolePicker
              value={roleId}
              onValueChange={setRoleId}
              label="Organization role"
              description="Choose the RBAC role for this member. “None” keeps the server default until a role is assigned."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
