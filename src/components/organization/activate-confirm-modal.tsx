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

import { organizationService, ORG_KEYS } from "@/lib/organization-service";

interface ActivateConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  organizationName: string;
}

export function ActivateConfirmModal({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: ActivateConfirmModalProps) {
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: organizationService.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      toast.success("Organization activated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to activate organization");
    },
  });

  const handleConfirm = () => {
    if (!organizationId) return;
    activateMutation.mutate(organizationId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate Organization</DialogTitle>
          <DialogDescription>
            Are you sure you want to re-activate{" "}
            <strong>{organizationName}</strong>? This will restore their access
            to the platform.
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
