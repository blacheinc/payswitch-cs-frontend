"use client";

import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, User, Loader2 } from "lucide-react";
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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { organizationService, ORG_KEYS } from "@/lib/organization-service";
import { INDUSTRY_TYPE_ENUM } from "@/lib/constant";
import {
  createOrganizationSchema,
  type CreateOrganizationValues,
} from "@/lib/schemas/organization-management";

interface AddOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddOrganizationModal({
  open,
  onOpenChange,
}: AddOrganizationModalProps) {
  const queryClient = useQueryClient();
  const baseId = useId();
  const form = useForm<CreateOrganizationValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      shortName: "",
      industryType: INDUSTRY_TYPE_ENUM.FINTECH.value,
      address: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        shortName: "",
        industryType: INDUSTRY_TYPE_ENUM.FINTECH.value,
        address: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: organizationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_KEYS.all });
      onOpenChange(false);
      form.reset();
      toast.success("Organization created successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create organization");
    },
  });

  const handleSubmit = (values: CreateOrganizationValues) => {
    createMutation.mutate({
      name: values.name,
      shortName: values.shortName,
      industryType: values.industryType,
      address: values.address || null,
      primaryContactName: values.contactName || null,
      primaryContactEmail: values.contactEmail || null,
      primaryContactPhone: values.contactPhone || null,
    });
  };

  const nameId = `${baseId}-name`;
  const shortNameId = `${baseId}-short-name`;
  const industryId = `${baseId}-industry`;
  const addressId = `${baseId}-address`;
  const contactNameId = `${baseId}-contact-name`;
  const contactEmailId = `${baseId}-contact-email`;
  const contactPhoneId = `${baseId}-contact-phone`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Organization</DialogTitle>
          <DialogDescription>
            Onboard a new client to the platform.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6 py-4"
          noValidate
        >
          <div className="space-y-3">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Organization Details
            </h3>
            <FieldGroup className="gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={nameId} required>
                        Full Name
                      </FieldLabel>
                      <Input
                        id={nameId}
                        placeholder="e.g. Ecobank Ghana Ltd"
                        aria-invalid={fieldState.invalid}
                        autoComplete="organization"
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="shortName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={shortNameId} required>
                        Short Name
                      </FieldLabel>
                      <Input
                        id={shortNameId}
                        placeholder="e.g. ecobank"
                        aria-invalid={fieldState.invalid}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_-]/g, ""),
                          )
                        }
                      />
                      <FieldDescription>
                        Lowercase letters, numbers, hyphens, underscores only.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="industryType"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={industryId} required>
                        Industry Type
                      </FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id={industryId} aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(INDUSTRY_TYPE_ENUM).map((industry) => (
                            <SelectItem key={industry.value} value={industry.value}>
                              {industry.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="address"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={addressId}>Address</FieldLabel>
                      <Input
                        id={addressId}
                        placeholder="Physical Address"
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="text-sm font-medium leading-none text-muted-foreground">
              Primary Contact
            </h3>
            <FieldGroup className="gap-4">
              <Controller
                name="contactName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={contactNameId}>Contact Name</FieldLabel>
                    <div className="relative">
                      <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id={contactNameId}
                        placeholder="Full Name"
                        className="pl-8"
                        aria-invalid={fieldState.invalid}
                        autoComplete="name"
                        {...field}
                      />
                    </div>
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
                      <FieldLabel htmlFor={contactEmailId}>Email</FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id={contactEmailId}
                          type="email"
                          placeholder="email@company.com"
                          className="pl-8"
                          aria-invalid={fieldState.invalid}
                          autoComplete="email"
                          {...field}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="contactPhone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor={contactPhoneId}>Phone</FieldLabel>
                      <div className="relative">
                        <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id={contactPhoneId}
                          placeholder="+233..."
                          className="pl-8"
                          aria-invalid={fieldState.invalid}
                          autoComplete="tel"
                          {...field}
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
