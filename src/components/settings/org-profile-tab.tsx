"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Mail, Phone, MapPin, Globe, Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  orgProfileService,
  ORG_PROFILE_KEYS,
} from "@/lib/organization-service";
import type { UpdateOrganizationRequest } from "@/types/organization-type";
import {
  orgProfileSchema,
  type OrgProfileValues,
} from "@/lib/schemas/settings-management";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSION_CODES } from "@/lib/constant";
import { NoPermission } from "@/components/shared/no-permission";

export function OrgProfileTab() {
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const canRead = can(PERMISSION_CODES.ORG.READ);
  const canUpdate = can(PERMISSION_CODES.ORG.UPDATE);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ORG_PROFILE_KEYS.detail(),
    queryFn: orgProfileService.get,
    enabled: canRead,
  });

  // ---- Form state ----
  const form = useForm<OrgProfileValues>({
    resolver: zodResolver(orgProfileSchema),
    defaultValues: {
      orgName: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      website: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        orgName: profile?.name ?? "",
        contactName: profile?.primaryContactName ?? "",
        contactEmail: profile?.primaryContactEmail ?? "",
        contactPhone: profile?.primaryContactPhone ?? "",
        address: profile?.address ?? "",
        website: "",
      });
    }
  }, [profile, form]);

  const updateMutation = useMutation({
    mutationFn: orgProfileService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORG_PROFILE_KEYS.all });
      toast.success("Organization profile updated");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update profile");
    },
  });

  const handleSaveProfile = (values: OrgProfileValues) => {
    const payload: UpdateOrganizationRequest = {
      name: values.orgName || null,
      primaryContactName: values.contactName || null,
      primaryContactEmail: values.contactEmail || null,
      primaryContactPhone: values.contactPhone || null,
      address: values.address || null,
    };
    updateMutation.mutate(payload);
  };

  if (!canRead) {
    return <NoPermission inline />;
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Details about your institution shown on reports and API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <FormFieldSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>
              Primary contact information for platform-related communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <FormFieldSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSaveProfile)}
      className="space-y-6"
      noValidate
    >
      {/* `fieldset[disabled]` greys-out every nested control when the user
          can read but not update — they see their data, can't change it. */}
      <fieldset disabled={!canUpdate} className="space-y-6 contents">
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Details about your institution shown on reports and API requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="orgName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="org-name" required>
                    Organization Name
                  </FieldLabel>
                  <Input id="org-name" aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="org-short-name">Short Name / ID</FieldLabel>
              <Input id="org-short-name" value={profile?.shortName ?? ""} disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="industry">Industry Type</FieldLabel>
              <Input id="industry" value={profile?.industryType ?? ""} disabled />
            </Field>
            <Controller
              name="address"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="address">Address</FieldLabel>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-9"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
          <CardDescription>
            Primary contact information for platform-related communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="contactName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="contact-name">Contact Name</FieldLabel>
                  <Input id="contact-name" aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="contactEmail"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="contact-email">Contact Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contact-email"
                      className="pl-9"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="contactPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="contact-phone">Contact Phone</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contact-phone"
                      className="pl-9"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="website"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="website">Website</FieldLabel>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      className="pl-9"
                      placeholder="https://example.com"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </CardContent>
      </Card>

      </fieldset>
      {canUpdate && (
        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </form>
  );
}

/**
 * Skeleton placeholder for a single `<Field>` (label + input).
 */
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
