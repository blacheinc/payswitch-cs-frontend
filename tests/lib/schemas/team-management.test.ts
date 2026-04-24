import { describe, it, expect } from "vitest";
import {
  inviteTeamMemberSchema,
  editOrgUserSchema,
} from "@/lib/schemas/team-management";

const VALID_UUID = "00000000-0000-4000-8000-000000000001";

describe("inviteTeamMemberSchema", () => {
  it("accepts a valid invitation", () => {
    const result = inviteTeamMemberSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      roleId: VALID_UUID,
    });
    expect(result.success).toBe(true);
  });

  it("trims name and email before validating", () => {
    const result = inviteTeamMemberSchema.safeParse({
      name: "  Ada  ",
      email: "  ada@example.com  ",
      roleId: VALID_UUID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ada");
      expect(result.data.email).toBe("ada@example.com");
    }
  });

  it("rejects empty name", () => {
    expect(
      inviteTeamMemberSchema.safeParse({
        name: "",
        email: "a@b.com",
        roleId: VALID_UUID,
      }).success,
    ).toBe(false);
  });

  it("rejects names over 200 characters", () => {
    expect(
      inviteTeamMemberSchema.safeParse({
        name: "a".repeat(201),
        email: "a@b.com",
        roleId: VALID_UUID,
      }).success,
    ).toBe(false);
  });

  it("rejects malformed email", () => {
    expect(
      inviteTeamMemberSchema.safeParse({
        name: "Ada",
        email: "not-an-email",
        roleId: VALID_UUID,
      }).success,
    ).toBe(false);
  });

  it("rejects roleId that is not a UUID", () => {
    expect(
      inviteTeamMemberSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        roleId: "credit_officer",
      }).success,
    ).toBe(false);
  });

  it("rejects empty roleId", () => {
    expect(
      inviteTeamMemberSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        roleId: "",
      }).success,
    ).toBe(false);
  });
});

describe("editOrgUserSchema", () => {
  it("accepts an empty roleId (no role change)", () => {
    expect(
      editOrgUserSchema.safeParse({ name: "Ada", roleId: "" }).success,
    ).toBe(true);
  });

  it("accepts a valid UUID roleId", () => {
    expect(
      editOrgUserSchema.safeParse({ name: "Ada", roleId: VALID_UUID }).success,
    ).toBe(true);
  });

  it("rejects a non-UUID, non-empty roleId", () => {
    expect(
      editOrgUserSchema.safeParse({ name: "Ada", roleId: "admin" }).success,
    ).toBe(false);
  });
});
