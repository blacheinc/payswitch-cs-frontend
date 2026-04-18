import { z } from "zod";

const optionalText = z.string().trim().optional().or(z.literal(""));

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  shortName: z
    .string()
    .trim()
    .min(1, "Short name is required")
    .regex(
      /^[a-z0-9_-]+$/,
      "Use lowercase letters, numbers, hyphens, and underscores only",
    ),
  industryType: z.string().trim().min(1, "Industry type is required"),
  address: optionalText,
  contactName: optionalText,
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: optionalText,
});

export const editOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  contactName: optionalText,
  contactEmail: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: optionalText,
  address: optionalText,
});

export const suspendOrganizationSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Reason must be at least 5 characters"),
});

export type CreateOrganizationValues = z.infer<typeof createOrganizationSchema>;
export type EditOrganizationValues = z.infer<typeof editOrganizationSchema>;
export type SuspendOrganizationValues = z.infer<typeof suspendOrganizationSchema>;
