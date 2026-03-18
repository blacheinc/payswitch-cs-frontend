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
import { ROUTES } from "@/lib/constant";

interface ProvisionOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null;
  organizationName: string;
}

export function ProvisionOrganizationModal({
  open,
  onOpenChange,
  organizationId,
  organizationName,
}: ProvisionOrganizationModalProps) {
  const queryClient = useQueryClient();

  const provisionMutation = useMutation({
    mutationFn: (id: string) => {
      const callbackUrl = `${window.location.origin}${ROUTES.AUTH.LOGIN}`;
      return organizationService.provision(id, { callbackUrl });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      toast.success(
        data?.message ||
          "Organization provisioned — login details sent via email",
      );
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to provision organization");
    },
  });

  const handleProvision = () => {
    if (!organizationId) return;
    provisionMutation.mutate(organizationId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Provision Organization
          </DialogTitle>
          <DialogDescription>
            This will provision <strong>{organizationName}</strong> and send
            login credentials to the organization&apos;s primary contact email.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={provisionMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProvision}
            disabled={provisionMutation.isPending}
          >
            {provisionMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Provision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
