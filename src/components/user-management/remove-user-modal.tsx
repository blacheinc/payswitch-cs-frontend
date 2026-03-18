"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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

import {
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";

interface RemoveUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

export function RemoveUserModal({
  open,
  onOpenChange,
  userId,
  userName,
}: RemoveUserModalProps) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: userManagementService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      toast.success("User removed from organization");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove user");
    },
  });

  const handleConfirm = () => {
    if (!userId) return;
    removeMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{userName}</strong> from the
            organization? They will immediately lose access to all resources.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={removeMutation.isPending}
          >
            {removeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Remove User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
