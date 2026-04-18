import { z } from "zod";

/**
 * Validates a single batch item — mirrors the backend BatchItemPayload.
 * Server requires at least one of full_name / identification / phone_number,
 * but date_of_birth is always mandatory.
 */
export const batchItemSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(200, "Full name must be at most 200 characters")
      .optional()
      .or(z.literal("")),
    dateOfBirth: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    identification: z
      .string()
      .trim()
      .max(50, "Identification must be at most 50 characters")
      .optional()
      .or(z.literal("")),
    phoneNumber: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{10,15}$/, "Phone must be 10-15 digits, optional '+'")
      .optional()
      .or(z.literal("")),
    accountNumber: z
      .string()
      .trim()
      .max(50, "Account number must be at most 50 characters")
      .optional()
      .or(z.literal("")),
    enquiryReason: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (item) =>
      !!(item.fullName?.trim() || item.identification?.trim() || item.phoneNumber?.trim()),
    {
      message:
        "Provide at least one of full name, identification, or phone number",
      path: ["fullName"],
    },
  );

export const batchSubmitSchema = z.object({
  items: z
    .array(batchItemSchema)
    .min(1, "Add at least 1 applicant")
    .max(100, "A batch cannot contain more than 100 applicants"),
});

export type BatchItemValues = z.infer<typeof batchItemSchema>;
export type BatchSubmitValues = z.infer<typeof batchSubmitSchema>;
