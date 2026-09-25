// =============================================================================
// Pure helper — merges a stored session user with the latest /auth/me profile.
// Lives in its own module so it can be imported from BOTH server (Route
// Handlers) and client code without dragging in axios / localStorage.
// =============================================================================

import type { AdminUser, User } from "@/types/models";
import type { UserProfileResponse } from "@/types/auth-type";

/**
 * Drop the permission set before sending a user to the browser.
 *
 * Permissions stay in the HttpOnly session cookie and reach the UI only
 * through the server-rendered layout, so tampering with a login or /auth/me
 * response cannot change what renders (VAPT §2.8).
 */
export function withoutPermissions(user: User): User {
  const { permissions, ...rest } = user;
  void permissions;
  return rest as User;
}

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
    totp_enabled: profile.totp_enabled ?? existing.totp_enabled,
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
