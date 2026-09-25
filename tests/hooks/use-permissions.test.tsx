import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { usePermissions } from "@/hooks/use-permissions";
import { PermissionsProvider } from "@/contexts/permissions-context";
import { PERMISSION_CODES, type PermissionCode } from "@/lib/constant";

// The permission set is supplied by the server-rendered layout from the
// HttpOnly session cookie — never from a login/me response or localStorage
// (VAPT §2.8).
function renderPermissions(permissions: string[]) {
  return renderHook(() => usePermissions(), {
    wrapper: ({ children }) => (
      <PermissionsProvider permissions={permissions}>
        {children}
      </PermissionsProvider>
    ),
  });
}

describe("usePermissions", () => {
  it("returns can=true only for codes the user holds", () => {
    const { result } = renderPermissions([PERMISSION_CODES.SCORE_REQUESTS.LIST]);

    expect(result.current.can(PERMISSION_CODES.SCORE_REQUESTS.LIST)).toBe(true);
    expect(result.current.can(PERMISSION_CODES.USERS.LIST)).toBe(false);
  });

  it("treats `*` as super-admin and grants all codes", () => {
    const { result } = renderPermissions(["*"]);

    expect(result.current.can(PERMISSION_CODES.USERS.LIST)).toBe(true);
    expect(result.current.can(PERMISSION_CODES.ROLES.READ)).toBe(true);
    expect(result.current.can("anything.at.all" as PermissionCode)).toBe(true);
  });

  it("exposes the resolved permission set", () => {
    const { result } = renderPermissions([
      PERMISSION_CODES.USERS.LIST,
      PERMISSION_CODES.ROLES.READ,
    ]);

    expect(result.current.permissions.has(PERMISSION_CODES.USERS.LIST)).toBe(
      true,
    );
    expect(result.current.permissions.size).toBe(2);
  });

  it("denies everything when no provider supplied a set", () => {
    const { result } = renderHook(() => usePermissions());

    expect(result.current.can(PERMISSION_CODES.USERS.LIST)).toBe(false);
    expect(result.current.permissions.size).toBe(0);
  });

  it("never reports loading — the set resolves before first paint", () => {
    const { result } = renderPermissions([]);
    expect(result.current.isLoading).toBe(false);
  });
});
