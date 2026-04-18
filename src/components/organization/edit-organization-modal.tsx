"use client";

import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import type { OrganizationResponse } from "@/types/organization-type";
import {
  editOrganizationSchema,
  type EditOrganizationValues,
} from "@/lib/schemas/organization-management";

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationResponse | null;
}

export function EditOrganizationModal({
  open,
  onOpenChange,
  organization,
}: EditOrganizationModalProps) {
  const queryClient = useQueryClient();
  const baseId = useId();
  const form = useForm<EditOrganizationValues>({
    resolver: zodResolver(editOrganizationSchema),
    defaultValues: {
      name: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
    },
    mode: "onTouched",
  });

  // Populate form when organization changes
  useEffect(() => {
    if (open && organization) {
      form.reset({
        name: organization.name ?? "",
        contactName: organization.primaryContactName ?? "",
        contactEmail: organization.primaryContactEmail ?? "",
        contactPhone: organization.primaryContactPhone ?? "",
        address: organization.address ?? "",
      });
    }
  }, [open, organization, form]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof organizationService.update>[1];
    }) => organizationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update organization");
    },
  });

  const handleSubmit = (values: EditOrganizationValues) => {
    if (!organization) return;
    updateMutation.mutate({
      id: organization.id,
      data: {
        name: values.name || null,
        primaryContactName: values.contactName || null,
        primaryContactEmail: values.contactEmail || null,
        primaryContactPhone: values.contactPhone || null,
        address: values.address || null,
      },
    });
  };

  const nameId = `${baseId}-name`;
  const contactNameId = `${baseId}-contact-name`;
  const contactEmailId = `${baseId}-contact-email`;
  const contactPhoneId = `${baseId}-contact-phone`;
  const addressId = `${baseId}-address`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update details for {organization?.name}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4 py-4"
          noValidate
        >
          <FieldGroup className="gap-4">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={nameId} required>
                    Organization Name
                  </FieldLabel>
                  <Input id={nameId} aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="contactName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={contactNameId}>Contact Name</FieldLabel>
                  <Input
                    id={contactNameId}
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="contactEmail"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={contactEmailId}>Contact Email</FieldLabel>
                    <Input
                      id={contactEmailId}
                      type="email"
                      aria-invalid={fieldState.invalid}
                      autoComplete="email"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="contactPhone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={contactPhoneId}>Contact Phone</FieldLabel>
                    <Input
                      id={contactPhoneId}
                      aria-invalid={fieldState.invalid}
                      autoComplete="tel"
                      {...field}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor={addressId}>Address</FieldLabel>
                  <Input id={addressId} aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
