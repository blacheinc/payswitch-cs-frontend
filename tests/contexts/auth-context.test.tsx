import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { saveUserCache, getUserCache } from "@/lib/session-storage";
import type { AdminUser, OrgUser, User } from "@/types/models";

// `authService.getMe` is the network seam: AuthContext calls it on mount and
// after every refreshSession(). We mock it so tests can drive every branch
// (success / 401 / different user types) without spinning up MSW for every case.
const getMeMock = vi.fn();
const logoutMock = vi.fn().mockResolvedValue({ message: "ok" });

vi.mock("@/lib/auth-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth-service")>(
    "@/lib/auth-service",
  );
  return {
    ...actual,
    authService: {
      ...actual.authService,
      getMe: () => getMeMock(),
      logout: () => logoutMock(),
    },
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

const orgProfile = {
  id: "u-1",
  email: "user@example.com",
  name: "Org User",
  role: "User",
  status: "active",
  user_type: "org",
  organization_id: "org-1",
  permissions: ["score_requests.list"],
  created_at: "2026-04-01T00:00:00Z",
};

const adminProfile = {
  ...orgProfile,
  id: "u-2",
  email: "admin@example.com",
  name: "Admin User",
  role: "Super Admin",
  user_type: "admin",
  organization_id: null,
  permissions: ["*"],
};

beforeEach(() => {
  getMeMock.mockReset();
  logoutMock.mockReset().mockResolvedValue({ message: "ok" });
  getMeMock.mockResolvedValue(orgProfile);
});

describe("AuthContext — initialization", () => {
  it("starts unauthenticated when /api/auth/me rejects (no cookie)", async () => {
    getMeMock.mockRejectedValue({ statusCode: 401 });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.organization).toBeNull();
    expect(result.current.isAdmin).toBe(false);
  });

  it("hydrates org user from /api/auth/me response", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.id).toBe("u-1");
    expect(result.current.isAdmin).toBe(false);
    // Local cache is populated for next reload's instant hydration.
    expect(getUserCache()?.user.id).toBe("u-1");
  });

  it("hydrates admin user without organization", async () => {
    getMeMock.mockResolvedValue(adminProfile);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.organization).toBeNull();
  });

  it("renders cached user immediately, then refreshes from /api/auth/me", async () => {
    saveUserCache({ user: orgUser, userType: "org" });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Cached value is visible synchronously after first render.
    await waitFor(() => expect(result.current.user?.id).toBe("u-1"));
    // /api/auth/me fulfils → loading clears.
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("clears the cache when /api/auth/me rejects (session truly gone)", async () => {
    saveUserCache({ user: orgUser, userType: "org" });
    getMeMock.mockRejectedValue({ statusCode: 401 });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(getUserCache()).toBeNull();
  });
});

describe("AuthContext — session mutations", () => {
  it("setSession populates state from a logged-in user", async () => {
    getMeMock.mockRejectedValue({ statusCode: 401 });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setSession("org", orgUser as unknown as User);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.id).toBe("u-1");
    expect(getUserCache()?.userType).toBe("org");
  });

  it("logout calls authService.logout, clears cache, drops state", async () => {
    saveUserCache({ user: orgUser, userType: "org" });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    // logout is async now — we await before assertions to make sure the
    // server-side cookie clear has had a chance to land before navigation
    // kicks the user out (in real life). In tests, jsdom has no navigation
    // so we just assert the post-logout state.
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(getUserCache()).toBeNull();
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
