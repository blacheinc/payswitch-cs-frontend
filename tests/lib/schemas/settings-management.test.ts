import { describe, it, expect } from "vitest";
import {
  changePasswordSchema,
  twoFactorVerifySchema,
  removeTwoFactorSchema,
  orgProfileSchema,
} from "@/lib/schemas/settings-management";

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "old-password",
    newPassword: "New-Password-123!",
    confirmPassword: "New-Password-123!",
  };

  it("accepts a valid payload", () => {
    expect(() => changePasswordSchema.parse(valid)).not.toThrow();
  });

  it("rejects when new password is shorter than 8 chars", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("newPassword");
    }
  });

  // Change-password used to require length 8 only while reset-password
  // enforced full complexity. Both now share strongPasswordSchema.
  it.each([
    ["nouppercase-1!", "no uppercase"],
    ["NOLOWERCASE-1!", "no lowercase"],
    ["No-Digits-Here!", "no digit"],
    ["NoSpecialChar1", "no special character"],
  ])("rejects a new password with %s (%s)", (newPassword) => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      newPassword,
      confirmPassword: newPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("newPassword"))).toBe(true);
    }
  });

  it("rejects when new password equals current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "Same-Password-1!",
      newPassword: "Same-Password-1!",
      confirmPassword: "Same-Password-1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("newPassword"))).toBe(true);
    }
  });

  it("rejects when confirmation does not match", () => {
    const result = changePasswordSchema.safeParse({
      ...valid,
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("confirmPassword"))).toBe(true);
    }
  });

  it("rejects when current password is empty", () => {
    const result = changePasswordSchema.safeParse({ ...valid, currentPassword: "" });
    expect(result.success).toBe(false);
  });
});

describe("twoFactorVerifySchema", () => {
  it("accepts exactly 6 digits", () => {
    expect(twoFactorVerifySchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  it.each([
    ["", "empty"],
    ["12345", "5 digits"],
    ["1234567", "7 digits"],
    ["abcdef", "letters"],
    ["12345a", "mixed"],
  ])("rejects %s (%s)", (code) => {
    expect(twoFactorVerifySchema.safeParse({ code }).success).toBe(false);
  });
});

describe("removeTwoFactorSchema", () => {
  it("accepts password + 6-digit code", () => {
    expect(
      removeTwoFactorSchema.safeParse({ password: "p", code: "123456" }).success,
    ).toBe(true);
  });

  it("rejects without password", () => {
    expect(
      removeTwoFactorSchema.safeParse({ password: "", code: "123456" }).success,
    ).toBe(false);
  });

  it("rejects with malformed code", () => {
    expect(
      removeTwoFactorSchema.safeParse({ password: "p", code: "12345" }).success,
    ).toBe(false);
  });
});

describe("orgProfileSchema", () => {
  it("accepts a name only", () => {
    expect(orgProfileSchema.safeParse({ orgName: "Test Org" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(orgProfileSchema.safeParse({ orgName: "" }).success).toBe(false);
  });

  it("rejects whitespace-only name", () => {
    expect(orgProfileSchema.safeParse({ orgName: "   " }).success).toBe(false);
  });

  it("accepts empty optional fields as empty strings", () => {
    const result = orgProfileSchema.safeParse({
      orgName: "Test",
      contactEmail: "",
      website: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = orgProfileSchema.safeParse({
      orgName: "Test",
      contactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed email", () => {
    const result = orgProfileSchema.safeParse({
      orgName: "Test",
      contactEmail: "ops@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid URL", () => {
    const result = orgProfileSchema.safeParse({
      orgName: "Test",
      website: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a well-formed URL", () => {
    const result = orgProfileSchema.safeParse({
      orgName: "Test",
      website: "https://example.com",
    });
    expect(result.success).toBe(true);
  });
});
