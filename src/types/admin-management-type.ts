// ==================== PLATFORM ADMIN MEMBER MANAGEMENT ====================
// Types for /admin/admins/* endpoints — platform admin CRUD.

export type AdminStatus = "active" | "deactivated";

export interface AdminMember {
  id: string;
  email: string;
  name: string;
  status: AdminStatus;
  roleId: string | null;
  roleName: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface InviteAdminRequest {
  email: string;
  name: string;
  /** Platform-scoped role UUID. Omit to default to system SUPER_ADMIN. */
  roleId?: string | null;
  /** Landing page linked from the invite email. */
  callbackUrl?: string;
}

export interface UpdateAdminRequest {
  name?: string;
  /** Must be a platform-scoped role UUID. */
  roleId?: string;
}
