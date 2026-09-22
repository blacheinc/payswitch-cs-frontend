import { describe, it, expect } from "vitest";
import { mergeUserFromMeProfile } from "@/lib/user-merge";
import type { User } from "@/types/models";
import type { UserProfileResponse } from "@/types/auth-type";

const existing: User = {
  id: "u-1",
  email: "a@example.com",
  name: "Ada",
  roleLabel: "admin" as User["roleLabel"],
  status: "active" as User["status"],
  createdAt: "2026-01-01T00:00:00.000Z",
  permissions: ["users.list"],
};

function profile(over: Partial<UserProfileResponse> = {}): UserProfileResponse {
  return {
    id: "u-1",
    email: "a@example.com",
    name: "Ada",
    role: "admin",
    status: "active",
    user_type: "org",
    organization_id: null,
    permissions: ["users.list"],
    totp_enabled: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...over,
  } as UserProfileResponse;
}

describe("mergeUserFromMeProfile", () => {
  // The merge rebuilds the user from an explicit field list. totp_enabled was
  // missing from it, so /auth/me always resolved false and the 2FA toggle
  // could never show "on" — which then offered the setup wizard on an
  // already-enrolled account and got a 403 back.
  it("carries totp_enabled through from the profile", () => {
    const merged = mergeUserFromMeProfile(existing, profile({ totp_enabled: true }));
    expect(merged.totp_enabled).toBe(true);
  });

  it("reflects the profile turning 2FA off", () => {
    const merged = mergeUserFromMeProfile(
      { ...existing, totp_enabled: true },
      profile({ totp_enabled: false }),
    );
    expect(merged.totp_enabled).toBe(false);
  });

  it("keeps the existing value when the profile omits the field", () => {
    const p = profile();
    delete (p as Partial<UserProfileResponse>).totp_enabled;
    const merged = mergeUserFromMeProfile({ ...existing, totp_enabled: true }, p);
    expect(merged.totp_enabled).toBe(true);
  });

  it("survives the admin branch", () => {
    const merged = mergeUserFromMeProfile(
      existing,
      profile({ user_type: "admin", totp_enabled: true }),
    );
    expect(merged.totp_enabled).toBe(true);
    expect("isAdmin" in merged && merged.isAdmin).toBe(true);
  });

  it("survives the admin → org downgrade branch", () => {
    const merged = mergeUserFromMeProfile(
      { ...existing, isAdmin: true, adminRole: "super_admin" } as User,
      profile({ user_type: "org", totp_enabled: true }),
    );
    expect(merged.totp_enabled).toBe(true);
    expect("isAdmin" in merged).toBe(false);
  });
});
