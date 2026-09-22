import { z } from "zod";

/**
 * Mirrors the server policy so users don't meet the rules via a 422. The server
 * also rejects low variety and common passwords — surface its message for those.
 */
export const PASSWORD_MIN_LENGTH = 12;

/** Exposed so checklists render from the same source that validates. */
export const PASSWORD_RULES: ReadonlyArray<{
  label: string;
  test: (value: string) => boolean;
}> = [
  {
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (v) => v.length >= PASSWORD_MIN_LENGTH,
  },
  {
    label: "Upper and lowercase letters",
    test: (v) => /[A-Z]/.test(v) && /[a-z]/.test(v),
  },
  { label: "At least one number", test: (v) => /[0-9]/.test(v) },
  {
    label: "At least one special character",
    test: (v) => /[^a-zA-Z0-9]/.test(v),
  },
];

export const strongPasswordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  )
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character");
