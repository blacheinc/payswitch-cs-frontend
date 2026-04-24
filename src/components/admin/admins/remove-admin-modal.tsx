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
  adminManagementService,
  ADMIN_MGMT_KEYS,
} from "@/lib/admin-management-service";

interface RemoveAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string | null;
  adminName: string;
}

export function RemoveAdminModal({
  open,
  onOpenChange,
  adminId,
  adminName,
}: RemoveAdminModalProps) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: adminManagementService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MGMT_KEYS.all });
      toast.success(`${adminName} has been removed`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to remove administrator");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Remove administrator?</DialogTitle>
          <DialogDescription>
            <strong>{adminName}</strong> will be deactivated and detached from
            their role. Their audit trail is preserved, but they can&apos;t
            sign in and will need to be re-invited to return.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => adminId && removeMutation.mutate(adminId)}
            disabled={!adminId || removeMutation.isPending}
          >
            {removeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Remove administrator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
