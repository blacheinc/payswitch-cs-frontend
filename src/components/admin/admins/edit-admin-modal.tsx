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
import { RolePicker } from "@/components/shared/role-picker";
import {
  updateAdminSchema,
  type UpdateAdminValues,
} from "@/lib/schemas/admin-management";
import type { AdminMember } from "@/types/admin-management-type";

interface EditAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admin: AdminMember | null;
  /** When true, disables the role field — used for the last active SUPER_ADMIN. */
  lockRole?: boolean;
}

export function EditAdminModal({
  open,
  onOpenChange,
  admin,
  lockRole,
}: EditAdminModalProps) {
  const queryClient = useQueryClient();
  const baseId = useId();
  const nameId = `${baseId}-name`;

  const form = useForm<UpdateAdminValues>({
    resolver: zodResolver(updateAdminSchema),
    defaultValues: { name: "", roleId: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (open && admin) {
      form.reset({ name: admin.name, roleId: admin.roleId ?? "" });
    }
  }, [open, admin, form]);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: UpdateAdminValues;
    }) => {
      const payload: Parameters<typeof adminManagementService.update>[1] = {};
      if (values.name !== undefined) payload.name = values.name;
      if (values.roleId !== undefined && values.roleId !== "") {
        payload.roleId = values.roleId;
      }
      return adminManagementService.update(id, payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_MGMT_KEYS.all });
      toast.success(`Updated ${updated.name}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to update administrator");
    },
  });

  const onSubmit = (values: UpdateAdminValues) => {
    if (!admin) return;
    updateMutation.mutate({ id: admin.id, values });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Edit administrator</DialogTitle>
          <DialogDescription>
            Update the admin&apos;s name or reassign their platform role.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 py-2"
          noValidate
        >
          <FieldGroup className="gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-muted-foreground">
                Identity
              </h3>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel htmlFor={nameId} required>
                      Full name
                    </FieldLabel>
                    <Input
                      id={nameId}
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {admin && (
                <p className="text-xs text-muted-foreground">
                  Email: <span className="font-mono">{admin.email}</span>
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none text-muted-foreground">
                Role
              </h3>
              {lockRole ? (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                  This is the last active Super Admin. Promote another admin
                  to Super Admin first before changing this role.
                </p>
              ) : (
                <Controller
                  name="roleId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>Platform role</FieldLabel>
                      <RolePicker
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        scope="platform"
                        allowNone={false}
                        label=""
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </div>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:gap-0">
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
