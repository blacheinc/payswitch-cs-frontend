// =============================================================================
// Pure helper — merges a stored session user with the latest /auth/me profile.
// Lives in its own module so it can be imported from BOTH server (Route
// Handlers) and client code without dragging in axios / localStorage.
// =============================================================================

import type { AdminUser, User } from "@/types/models";
import type { UserProfileResponse } from "@/types/auth-type";

export function mergeUserFromMeProfile(
  existing: User,
  profile: UserProfileResponse,
  sessionUserType?: string,
): User {
  const effectiveType = profile.user_type || sessionUserType;
  const permissions = profile.permissions ?? existing.permissions ?? [];

  const next: User = {
    ...existing,
    id: profile.id,
    email: profile.email,
    name: profile.name,
    roleLabel: profile.role as User["roleLabel"],
    status: profile.status as User["status"],
    lastLoginAt: profile.last_login_at ?? existing.lastLoginAt,
    createdAt: profile.created_at || existing.createdAt,
    organizationId: profile.organization_id ?? existing.organizationId,
    permissions,
  };

  if (effectiveType === "admin") {
    return {
      ...next,
      isAdmin: true,
      adminRole:
        "isAdmin" in existing && existing.isAdmin
          ? (existing as AdminUser).adminRole
          : "super_admin",
    } as AdminUser;
  }

  if ("isAdmin" in next && (next as AdminUser).isAdmin) {
    const asAdmin = next as AdminUser;
    const { isAdmin, adminRole, ...orgShape } = asAdmin;
    void isAdmin;
    void adminRole;
    return orgShape as User;
  }

  return next;
}
