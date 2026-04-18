import { z } from "zod";

const webhookUrlSchema = z
  .string()
  .trim()
  .min(1, "Webhook URL is required")
  .url("Enter a valid URL")
  .refine((value) => /^https?:\/\//i.test(value), {
    message: "Webhook URL must start with http:// or https://",
  });

export const addDataSourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  shortCode: z
    .string()
    .trim()
    .min(1, "Short code is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only"),
  sourceType: z.string().trim().min(1, "Source type is required"),
  description: z.string().trim(),
});

export const uploadDatasetSchema = z.object({
  sourceId: z.string().trim().min(1, "Data source is required"),
  file: z.instanceof(File, { message: "Dataset file is required" }),
});

export const webhookFormSchema = z.object({
  url: webhookUrlSchema,
  events: z.array(z.string()).min(1, "Select at least one event"),
  description: z.string().trim().optional().or(z.literal("")),
});

export const generateApiKeySchema = z.object({
  name: z.string().trim().min(1, "Key name is required"),
  environment: z.enum(["sandbox", "production"]),
  roleId: z.string().optional().or(z.literal("")),
});

export type AddDataSourceValues = z.infer<typeof addDataSourceSchema>;
export type UploadDatasetValues = z.infer<typeof uploadDatasetSchema>;
export type WebhookFormValues = z.infer<typeof webhookFormSchema>;
export type GenerateApiKeyValues = z.infer<typeof generateApiKeySchema>;
