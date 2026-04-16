"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { rbacService, RBAC_KEYS } from "@/lib/rbac-service";

interface DeleteRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: string | null;
  roleName: string;
}

export function DeleteRoleModal({
  open,
  onOpenChange,
  roleId,
  roleName,
}: DeleteRoleModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: rbacService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RBAC_KEYS.all });
      onOpenChange(false);
      toast.success(`Role "${roleName}" deleted`);
    },
    onError: (error: { message?: string }) => {
      toast.error(error?.message || "Failed to delete role");
    },
  });

  const handleConfirm = () => {
    if (!roleId) return;
    deleteMutation.mutate(roleId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <strong>{roleName}</strong>? Users currently assigned this role
            will lose its permissions. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
