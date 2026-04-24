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

interface ActivateAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminId: string | null;
  adminName: string;
}

export function ActivateAdminModal({
  open,
  onOpenChange,
  adminId,
  adminName,
}: ActivateAdminModalProps) {
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: adminManagementService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MGMT_KEYS.all });
      toast.success(`${adminName} has been reactivated`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to reactivate administrator");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Reactivate administrator?</DialogTitle>
          <DialogDescription>
            <strong>{adminName}</strong> will regain platform access with their
            existing role. They&apos;ll be able to sign in immediately.
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
            onClick={() => adminId && activateMutation.mutate(adminId)}
            disabled={!adminId || activateMutation.isPending}
          >
            {activateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
