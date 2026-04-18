"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import {
  suspendOrganizationSchema,
  type SuspendOrganizationValues,
} from "@/lib/schemas/organization-management";

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
  const form = useForm<SuspendOrganizationValues>({
    resolver: zodResolver(suspendOrganizationSchema),
    defaultValues: { reason: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      form.reset({ reason: "" });
    }
  }, [open, form]);

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      organizationService.suspend(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      form.reset({ reason: "" });
      toast.success("Organization suspended");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to suspend organization");
    },
  });

  const handleConfirm = (values: SuspendOrganizationValues) => {
    if (!organizationId) return;
    suspendMutation.mutate({ id: organizationId, reason: values.reason.trim() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) form.reset({ reason: "" });
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
        <form
          onSubmit={form.handleSubmit(handleConfirm)}
          className="space-y-4 py-4"
          noValidate
        >
          <Field>
            <FieldLabel htmlFor="suspend-reason" required>
              Reason
            </FieldLabel>
            <Textarea
              id="suspend-reason"
              placeholder="Enter suspension reason (min 5 characters)..."
              rows={3}
              aria-invalid={!!form.formState.errors.reason}
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <FieldError errors={[form.formState.errors.reason]} />
            )}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" type="submit" disabled={suspendMutation.isPending}>
              {suspendMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Suspension
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
