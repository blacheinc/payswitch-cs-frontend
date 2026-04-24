import { z } from "zod";

export const inviteAdminSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  /**
   * Platform-scoped role UUID. Empty string is allowed client-side — the
   * service layer translates it to `undefined` so the backend picks the system
   * SUPER_ADMIN default.
   */
  roleId: z.string().trim().optional().or(z.literal("")),
});

export const updateAdminSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  roleId: z
    .string()
    .trim()
    .uuid("Role id must be a valid UUID")
    .optional()
    .or(z.literal("")),
});

export type InviteAdminValues = z.infer<typeof inviteAdminSchema>;
export type UpdateAdminValues = z.infer<typeof updateAdminSchema>;
