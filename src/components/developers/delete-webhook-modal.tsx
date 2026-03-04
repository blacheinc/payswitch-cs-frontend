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

import { webhookService, WEBHOOK_KEYS } from "@/lib/developer-service";

interface DeleteWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string | null;
  webhookUrl: string;
}

export function DeleteWebhookModal({
  open,
  onOpenChange,
  webhookId,
  webhookUrl,
}: DeleteWebhookModalProps) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: webhookService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEBHOOK_KEYS.all });
      onOpenChange(false);
      toast.success("Webhook deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete webhook");
    },
  });

  const handleConfirm = () => {
    if (!webhookId) return;
    deleteMutation.mutate(webhookId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Webhook</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this webhook endpoint? Events will
            no longer be sent to{" "}
            <strong className="break-all">{webhookUrl}</strong>.
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
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
