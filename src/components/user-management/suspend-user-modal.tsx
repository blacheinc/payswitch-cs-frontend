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

interface SuspendUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
}

export function SuspendUserModal({
  open,
  onOpenChange,
  userId,
  userName,
}: SuspendUserModalProps) {
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: userManagementService.suspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      toast.success("User suspended");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to suspend user");
    },
  });

  const handleConfirm = () => {
    if (!userId) return;
    suspendMutation.mutate(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend User</DialogTitle>
          <DialogDescription>
            Are you sure you want to suspend <strong>{userName}</strong>? They
            will lose access to the platform until re-activated.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="warning"
            onClick={handleConfirm}
            disabled={suspendMutation.isPending}
          >
            {suspendMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Confirm Suspension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
