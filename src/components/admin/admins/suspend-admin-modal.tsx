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

interface SuspendAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string | null;
  adminName: string;
}

export function SuspendAdminModal({
  open,
  onOpenChange,
  adminId,
  adminName,
}: SuspendAdminModalProps) {
  const queryClient = useQueryClient();

  const suspendMutation = useMutation({
    mutationFn: adminManagementService.suspend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MGMT_KEYS.all });
      toast.success(`${adminName} has been suspended`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to suspend administrator");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Suspend administrator?</DialogTitle>
          <DialogDescription>
            <strong>{adminName}</strong> will lose platform access immediately
            and can&apos;t sign in until reactivated. Their role assignment is
            preserved.
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
            onClick={() => adminId && suspendMutation.mutate(adminId)}
            disabled={!adminId || suspendMutation.isPending}
          >
            {suspendMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Suspend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
