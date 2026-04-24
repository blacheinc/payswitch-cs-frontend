"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Mail, Phone, MapPin, Globe, Loader2 } from "lucide-react";
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

export function OrgProfileTab() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ORG_PROFILE_KEYS.detail(),
    queryFn: orgProfileService.get,
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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSaveProfile)}
      className="space-y-6"
      noValidate
    >
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
    </form>
  );
}
