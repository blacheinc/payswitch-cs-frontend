"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";

interface SuspendOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
}

export function SuspendOrganizationModal({
  open,
  onOpenChange,
  organizationId,
}: SuspendOrganizationModalProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      organizationService.suspend(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      setReason("");
      toast.success("Organization suspended");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to suspend organization");
    },
  });

  const handleConfirm = () => {
    if (!organizationId || reason.trim().length < 5) return;
    suspendMutation.mutate({ id: organizationId, reason });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setReason("");
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend Organization</DialogTitle>
          <DialogDescription>
            Please provide a reason for suspending this organization.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="suspend-reason">
            Reason <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="suspend-reason"
            placeholder="Enter suspension reason (min 5 characters)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.trim().length < 5 || suspendMutation.isPending}
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
