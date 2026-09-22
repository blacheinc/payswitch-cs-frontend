"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, User } from "lucide-react";
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";

import {
  adminManagementService,
  ADMIN_MGMT_KEYS,
} from "@/lib/admin-management-service";
import { ROUTES, prettyPlatformRoleName } from "@/lib/constant";
import { RolePicker } from "@/components/shared/role-picker";
import {
  inviteAdminSchema,
  type InviteAdminValues,
} from "@/lib/schemas/admin-management";
import type { RoleResponse } from "@/types/rbac-types";

const DEFAULTS: InviteAdminValues = {
  name: "",
  email: "",
  roleId: "",
};

interface InviteAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteAdminModal({
  open,
  onOpenChange,
}: InviteAdminModalProps) {
  const queryClient = useQueryClient();
  const baseId = useId();
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);

  const form = useForm<InviteAdminValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: DEFAULTS,
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      form.reset(DEFAULTS);
      setSelectedRole(null);
    }
  }, [open, form]);

  const inviteMutation = useMutation({
    mutationFn: adminManagementService.invite,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MGMT_KEYS.all });
      onOpenChange(false);
      form.reset(DEFAULTS);
      toast.success(`Invitation sent to ${variables.email}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to send invitation");
    },
  });

  const onSubmit = (values: InviteAdminValues) => {
    // Path only — the proxy rebuilds this against a server-decided origin.
    const callbackUrl = ROUTES.AUTH.ADMIN_LOGIN;
    inviteMutation.mutate({
      email: values.email,
      name: values.name,
      roleId: values.roleId || undefined,
      callbackUrl,
    });
  };

  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invite Administrator</DialogTitle>
          <DialogDescription>
            Send a platform-admin invitation. The invitee will receive an email
            with a temporary password and a sign-in link.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 py-4"
          noValidate
        >
          <FieldGroup className="gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-muted-foreground">
                Administrator details
              </h3>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={nameId} required>
                      Full name
                    </FieldLabel>
                    <div className="relative">
                      <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id={nameId}
                        placeholder="Kofi Ansah"
                        className="pl-8"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid}
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
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={emailId} required>
                      Email
                    </FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id={emailId}
                        type="email"
                        placeholder="name@payswitch.com"
                        className="pl-8"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid}
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

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-muted-foreground">
                Role
              </h3>
              <Controller
                name="roleId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Platform role</FieldLabel>
                    <RolePicker
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      onRoleChange={setSelectedRole}
                      scope="platform"
                      allowNone
                      label=""
                      placeholder="Defaults to Super Admin"
                      description="Leave blank to assign the default Super Admin role."
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send invitation
              {selectedRole?.name && (
                <span className="ml-2 text-xs opacity-80">
                  as {prettyPlatformRoleName(selectedRole.name)}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
