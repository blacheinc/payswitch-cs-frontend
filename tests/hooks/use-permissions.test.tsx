import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock the auth context. Tests adjust the user/auth fields per case.
const authState: {
  user: { id: string; permissions?: string[] } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => authState,
}));

import { usePermissions } from "@/hooks/use-permissions";

beforeEach(() => {
  authState.user = null;
  authState.isAuthenticated = false;
  authState.isLoading = false;
});

describe("usePermissions", () => {
  it("returns can=false for every code when permissions is empty", () => {
    authState.user = { id: "u-1", permissions: [] };
    authState.isAuthenticated = true;

    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("score_requests.list")).toBe(false);
    expect(result.current.can("admin.organizations.read")).toBe(false);
  });

  it("returns can=true only for codes the user holds", () => {
    authState.user = {
      id: "u-1",
      permissions: ["score_requests.list", "score_requests.read"],
    };
    authState.isAuthenticated = true;

    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("score_requests.list")).toBe(true);
    expect(result.current.can("score_requests.read")).toBe(true);
    expect(result.current.can("score_requests.override")).toBe(false);
  });

  it("treats `*` as super-admin and grants all codes", () => {
    authState.user = { id: "u-1", permissions: ["*"] };
    authState.isAuthenticated = true;

    const { result } = renderHook(() => usePermissions());
    expect(result.current.can("score_requests.list")).toBe(true);
    expect(result.current.can("admin.organizations.suspend")).toBe(true);
    expect(result.current.can("monitoring.compliance")).toBe(true);
  });

  it("isLoading=true when authenticated but permissions are still undefined", () => {
    authState.user = { id: "u-1" };
    authState.isAuthenticated = true;
    authState.isLoading = false;

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isLoading).toBe(true);
  });

  it("isLoading=false once permissions array is present (even empty)", () => {
    authState.user = { id: "u-1", permissions: [] };
    authState.isAuthenticated = true;

    const { result } = renderHook(() => usePermissions());
    expect(result.current.isLoading).toBe(false);
  });

  it("exposes the resolved permission set", () => {
    authState.user = { id: "u-1", permissions: ["a", "b"] };
    authState.isAuthenticated = true;

    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions.has("a")).toBe(true);
    expect(result.current.permissions.has("b")).toBe(true);
    expect(result.current.permissions.size).toBe(2);
  });
});
