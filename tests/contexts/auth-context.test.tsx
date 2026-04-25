import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { saveSession, getSession } from "@/lib/session-storage";
import type { AdminUser, OrgUser } from "@/types/models";

// We don't want the auth-context's GET /auth/me hit to do anything fancy in
// most tests. Mock authService at the module boundary.
const getMeMock = vi.fn();
vi.mock("@/lib/auth-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-service")>(
    "@/lib/auth-service",
  );
  return {
    ...actual,
    authService: {
      ...actual.authService,
      getMe: () => getMeMock(),
    },
    // Pass-through helper — re-exported so the provider's usage works.
    mergeUserFromMeProfile: actual.mergeUserFromMeProfile,
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

const orgUser: OrgUser = {
  id: "u-1",
  email: "user@example.com",
  name: "Org User",
  roleLabel: "User",
  status: "active",
  createdAt: "2026-04-01T00:00:00Z",
  organizationId: "org-1",
  organization: { id: "org-1", name: "Test Org", slug: "test-org" },
} as unknown as OrgUser;

const adminUser: AdminUser = {
  id: "u-2",
  email: "admin@example.com",
  name: "Admin User",
  isAdmin: true,
  adminRole: "super_admin",
  roleLabel: "Super Admin",
  status: "active",
  createdAt: "2026-04-01T00:00:00Z",
} as unknown as AdminUser;

beforeEach(() => {
  getMeMock.mockReset();
  // Default: getMe returns the same user back, no permission upgrades.
  getMeMock.mockResolvedValue({ ...orgUser, permissions: ["score_requests.list"] });
});

describe("AuthContext — initialization", () => {
  it("starts unauthenticated when no session is stored", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.organization).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("hydrates org user from a stored session", async () => {
    saveSession({
      accessToken: "a",
      refreshToken: "r",
      userType: "org",
      user: orgUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.id).toBe("u-1");
    expect(result.current.organization?.name).toBe("Test Org");
    expect(result.current.isAdmin).toBe(false);
  });

  it("hydrates admin user without organization", async () => {
    saveSession({
      accessToken: "a",
      refreshToken: "r",
      userType: "admin",
      user: adminUser,
    });
    getMeMock.mockResolvedValue({ ...adminUser, permissions: ["*"] });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.organization).toBeNull();
  });

  it("falls back to empty permissions when /auth/me fails", async () => {
    saveSession({
      accessToken: "a",
      refreshToken: "r",
      userType: "org",
      user: { ...orgUser, permissions: undefined } as unknown as OrgUser,
    });
    getMeMock.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() =>
      expect(Array.isArray(result.current.user?.permissions)).toBe(true),
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.permissions?.length).toBe(0);
  });
});

describe("AuthContext — session mutations", () => {
  it("setSession persists tokens + user and updates state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setSession("acc-2", "ref-2", "org", orgUser);
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.id).toBe("u-1");
    expect(getSession()?.accessToken).toBe("acc-2");
    expect(getSession()?.refreshToken).toBe("ref-2");
  });

  it("logout clears session and state", async () => {
    saveSession({
      accessToken: "a",
      refreshToken: "r",
      userType: "org",
      user: orgUser,
    });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => result.current.logout());

    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(getSession()).toBeNull();
  });

});
