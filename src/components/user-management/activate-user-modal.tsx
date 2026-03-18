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

interface ActivateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

export function ActivateUserModal({
  open,
  onOpenChange,
  userId,
  userName,
}: ActivateUserModalProps) {
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: userManagementService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      toast.success("User activated");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to activate user");
    },
  });

  const handleConfirm = () => {
    if (!userId) return;
    activateMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate User</DialogTitle>
          <DialogDescription>
            Are you sure you want to re-activate <strong>{userName}</strong>?
            This will restore their access to the platform.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={activateMutation.isPending}>
            {activateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Activation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
