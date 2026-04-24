"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, User, Loader2 } from "lucide-react";
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
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";
import { ROUTES } from "@/lib/constant";
import { RolePicker } from "@/components/shared/role-picker";
import {
  inviteTeamMemberSchema,
  type InviteTeamMemberValues,
} from "@/lib/schemas/team-management";
import type { RoleResponse } from "@/types/rbac-types";

const INVITE_DEFAULTS: InviteTeamMemberValues = {
  name: "",
  email: "",
  roleId: "",
};

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const queryClient = useQueryClient();
  const baseId = useId();
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);

  const form = useForm<InviteTeamMemberValues>({
    resolver: zodResolver(inviteTeamMemberSchema),
    defaultValues: INVITE_DEFAULTS,
    mode: "onTouched",
  });

  useEffect(() => {
    if (open) {
      form.reset(INVITE_DEFAULTS);
      setSelectedRole(null);
    }
  }, [open, form]);

  const inviteMutation = useMutation({
    mutationFn: userManagementService.invite,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      form.reset(INVITE_DEFAULTS);
      toast.success(`Invitation sent to ${variables.email}`);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to send invitation");
    },
  });

  const onSubmit = (values: InviteTeamMemberValues) => {
    if (!selectedRole) {
      toast.error("Please select a valid role");
      return;
    }

    const callbackUrl = `${window.location.origin}${ROUTES.AUTH.LOGIN}`;
    inviteMutation.mutate({
      email: values.email,
      name: values.name,
      roleId: values.roleId,
      roleLabel: selectedRole.name,
      callbackUrl,
    });
  };

  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They will receive an
            email to set up their account.
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
                Member details
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
                        placeholder="John Doe"
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
                        placeholder="colleague@company.com"
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
                    <FieldLabel required>Organization role (RBAC)</FieldLabel>
                    <RolePicker
                      value={field.value}
                      onValueChange={field.onChange}
                      onRoleChange={setSelectedRole}
                      allowNone={false}
                      label=""
                      placeholder="Select a role"
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
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
