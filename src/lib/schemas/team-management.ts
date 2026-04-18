import { z } from "zod";

export const inviteTeamMemberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Name must be at most 200 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  roleId: z
    .string()
    .min(1, "Select an organization role")
    .uuid("Select a valid organization role"),
});

export type InviteTeamMemberValues = z.infer<typeof inviteTeamMemberSchema>;

export const editOrgUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Name must be at most 200 characters"),
  roleId: z.union([
    z.literal(""),
    z.string().uuid("Select a valid organization role"),
  ]),
});

export type EditOrgUserValues = z.infer<typeof editOrgUserSchema>;
