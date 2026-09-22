"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Check, Eye, EyeOff, KeyRound, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/lib/auth-service";
import { strongPasswordSchema, PASSWORD_RULES } from "@/lib/schemas/password";
import { ROUTES } from "@/lib/constant";
import { cn } from "@/lib/utils";

// Forced first-login password change. Accounts on a system-generated password
// hold a token scoped to /auth/change-password and the route guard pins them
// here. On success we log out and re-login rather than upgrading the scoped
// token in place — that's the only way to be sure of a working refresh token.

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter the password you were emailed"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the one you were emailed",
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormData = z.infer<typeof changePasswordSchema>;

export default function ForcedChangePasswordPage() {
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  });

  const newPassword = form.watch("newPassword") || "";

  const mutation = useMutation({
    mutationFn: (values: FormData) =>
      authService.changePassword(values.currentPassword, values.newPassword),
    onSuccess: async () => {
      toast.success("Password updated. Please sign in with your new password.");
      // Drop the scoped session or the guard sends us straight back here.
      await authService.logout().catch(() => {});
      router.push(ROUTES.AUTH.LOGIN);
    },
    onError: (error: { message?: string; field?: string }) => {
      // Surface the server's wording — it enforces rules we can't check here.
      if (error?.field === "new_password" && error?.message) {
        form.setError("newPassword", { message: error.message });
        return;
      }
      toast.error(error?.message || "Could not update your password.");
    },
  });

  const onSubmit = (values: FormData) => mutation.mutate(values);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold">
            Set your password
          </CardTitle>
          <CardDescription className="text-center">
            Your account was created with a temporary password. Choose your own
            before continuing.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <Controller
              name="currentPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="currentPassword" required>
                    Temporary password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="The password from your email"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={
                        showCurrent ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="newPassword" required>
                    New password
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <ul className="mt-2 space-y-1" aria-live="polite">
                    {PASSWORD_RULES.map((rule) => {
                      const met = rule.test(newPassword);
                      return (
                        <li
                          key={rule.label}
                          className={cn(
                            "flex items-center gap-2 text-xs",
                            met ? "text-green-600" : "text-muted-foreground",
                          )}
                        >
                          {met ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor="confirmPassword" required>
                    Confirm new password
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Set password and continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
