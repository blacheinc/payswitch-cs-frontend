import { z } from "zod";

import { strongPasswordSchema } from "@/lib/schemas/password";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from current password",
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const twoFactorVerifySchema = z.object({
  code: z
    .string()
    .length(6, "Please enter a valid 6-digit code")
    .regex(/^\d{6}$/, "Please enter a valid 6-digit code"),
});

export const removeTwoFactorSchema = z.object({
  password: z.string().min(1, "Please enter your current password"),
  code: z
    .string()
    .length(6, "Please enter a valid 6-digit code")
    .regex(/^\d{6}$/, "Please enter a valid 6-digit code"),
});

export const orgProfileSchema = z.object({
  orgName: z.string().trim().min(1, "Organization name is required"),
  contactName: z.string().trim().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
});

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
export type TwoFactorVerifyValues = z.infer<typeof twoFactorVerifySchema>;
export type RemoveTwoFactorValues = z.infer<typeof removeTwoFactorSchema>;
export type OrgProfileValues = z.infer<typeof orgProfileSchema>;
