import { describe, it, expect, beforeEach } from "vitest";
import {
  saveUserCache,
  getUserCache,
  clearUserCache,
  type UserCache,
} from "@/lib/session-storage";
import type { User } from "@/types/models";

const sample: UserCache = {
  userType: "org",
  user: {
    id: "u-1",
    email: "user@example.com",
    name: "Test User",
    roleLabel: "User",
    permissions: ["score_requests.list"],
  } as unknown as User,
};

describe("user-cache (formerly session-storage)", () => {
  beforeEach(() => {
    clearUserCache();
  });

  it("round-trips the cache payload minus permissions", () => {
    saveUserCache(sample);

    const { permissions, ...userWithoutPerms } = sample.user;
    void permissions;
    expect(getUserCache()).toEqual({ ...sample, user: userWithoutPerms });
  });

  // Permissions live in the HttpOnly cookie and reach the UI via the
  // server-rendered layout. Caching them here would restore the exact vector
  // VAPT §2.8 describes, in an even easier-to-edit place.
  it("never persists permissions to localStorage", () => {
    saveUserCache(sample);

    expect(getUserCache()?.user).not.toHaveProperty("permissions");
    expect(localStorage.getItem("user_cache")).not.toContain("permissions");
  });

  it("returns null when nothing is stored", () => {
    expect(getUserCache()).toBeNull();
  });

  it("clearUserCache wipes the cached payload", () => {
    saveUserCache(sample);
    clearUserCache();
    expect(getUserCache()).toBeNull();
  });

  it("returns null on malformed JSON in localStorage", () => {
    localStorage.setItem("user_cache", "not-json{");
    expect(getUserCache()).toBeNull();
  });

  it("does NOT store any tokens — only user + userType", () => {
    saveUserCache(sample);
    const stored = localStorage.getItem("user_cache");
    expect(stored).toBeTruthy();
    expect(stored).not.toContain("accessToken");
    expect(stored).not.toContain("refreshToken");
  });
});
