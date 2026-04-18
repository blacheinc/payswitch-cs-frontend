"use client";

import { useEffect, useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Loader2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

import {
  userManagementService,
  USER_MGMT_KEYS,
} from "@/lib/user-management-service";
import type { OrgUserResponse } from "@/types/organization-type";
import { RolePicker } from "@/components/shared/role-picker";
import {
  editOrgUserSchema,
  type EditOrgUserValues,
} from "@/lib/schemas/team-management";

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: OrgUserResponse | null;
}

function valuesFromUser(user: OrgUserResponse | null): EditOrgUserValues {
  return {
    name: user?.name ?? "",
    roleId: user?.roleId ?? "",
  };
}

export function EditUserModal({
  open,
  onOpenChange,
  user,
}: EditUserModalProps) {
  const queryClient = useQueryClient();
  const baseId = useId();

  const form = useForm<EditOrgUserValues>({
    resolver: zodResolver(editOrgUserSchema),
    defaultValues: valuesFromUser(user),
    mode: "onTouched",
  });

  useEffect(() => {
    if (open && user) {
      form.reset(valuesFromUser(user));
    }
  }, [open, user, form]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof userManagementService.update>[1];
    }) => userManagementService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_MGMT_KEYS.all });
      onOpenChange(false);
      toast.success("User updated successfully");
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update user");
    },
  });

  const onSubmit = (values: EditOrgUserValues) => {
    if (!user) return;
    updateMutation.mutate({
      id: user.id,
      data: {
        name: values.name || null,
        roleId: values.roleId === "" ? null : values.roleId,
      },
    });
  };

  const nameId = `${baseId}-name`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update details for {user?.name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 py-4"
          noValidate
        >
          <FieldGroup className="gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-muted-foreground">
                User details
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
                    <FieldLabel>Organization role (RBAC)</FieldLabel>
                    <RolePicker
                      value={field.value}
                      onValueChange={field.onChange}
                      label=""
                    />
                    <FieldDescription>
                      Permissions come from Team → Roles.
                    </FieldDescription>
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
