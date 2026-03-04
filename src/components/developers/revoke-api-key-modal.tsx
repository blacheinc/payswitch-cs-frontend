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

import { apiKeyService, API_KEY_KEYS } from "@/lib/developer-service";

interface RevokeApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: string | null;
  keyName: string;
}

export function RevokeApiKeyModal({
  open,
  onOpenChange,
  keyId,
  keyName,
}: RevokeApiKeyModalProps) {
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: apiKeyService.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
      onOpenChange(false);
      toast.success("API key revoked");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to revoke API key");
    },
  });

  const handleConfirm = () => {
    if (!keyId) return;
    revokeMutation.mutate(keyId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke <strong>{keyName}</strong>? Any
            requests using this key will immediately stop working.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={revokeMutation.isPending}
          >
            {revokeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Revoke Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
