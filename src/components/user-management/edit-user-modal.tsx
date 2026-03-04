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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import {
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";
import type { OrgUserResponse } from "@/types/organization-type";
import { ROLE_LABELS_ENUM } from "@/lib/constant";

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
  const [roleLabel, setRoleLabel] = useState("");

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setRoleLabel(user.roleLabel);
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
      toast.error(error.message || "Failed to update user");
    },
  });

  const handleSubmit = () => {
    if (!user) return;
    updateMutation.mutate({
      id: user.id,
      data: {
        name: name || null,
        roleLabel: roleLabel || null,
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
              Access Level
            </h3>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={roleLabel} onValueChange={setRoleLabel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ROLE_LABELS_ENUM).map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
