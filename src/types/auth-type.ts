// ==================== AUTH API TYPES ====================
// Request and response shapes for all /auth/* endpoints.
// snake_case → camelCase mapping is handled in the service layer.

import type { User } from "./models";

// ---- Requests ----

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Verify2FARequest {
  code: string;
  tempToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface Remove2FARequest {
  password: string;
  code: string;
}

export interface ForgotPasswordRequest {
  email: string;
  callbackUrl?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// ---- Responses ----

/** POST /auth/login — returns tokens + user_type, or flags 2FA requirement. */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  requires2FA: boolean;
  userType: string;
}

/** POST /auth/2fa/verify — returns tokens after successful TOTP entry. */
export interface Verify2FAResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  message?: string;
}

/** GET /auth/me — returns current authenticated user profile. */
export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  user_type: string;
  role: string;
  status: string;
  totp_enabled: boolean;
  organization_id?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
  /** Resolved RBAC permission codes for this principal (from GET /auth/me). */
  permissions?: string[];
}

/** GET /auth/me/permissions — resolved permission set only. */
export interface UserPermissionsResponse {
  user_id: string;
  user_type: string;
  permissions: string[];
  is_super_admin: boolean;
}

/**
 * POST /auth/refresh — new access_token only (no refresh token rotation).
 */
export interface TokenRefreshResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

/** POST /auth/2fa/setup — TOTP secret + provisioning URI. */
export interface Setup2FAResponse {
  secret: string;
  uri: string;
  message: string;
  tempToken: string;
}

/**
 * Generic success envelope used by:
 * logout, forgot-password, reset-password, verify-email, change-password.
 */
export interface SuccessResponse {
  message: string;
}

// ---- Client-Enriched ----

/**
 * Client-side auth result returned by the service layer.
 * The `user` field is extracted from the JWT — the API never returns it directly.
 */
export interface AuthResult {
  requires2FA?: boolean;
  /**
   * The account is still on its system-generated password. The session that
   * was just established is scoped to `/auth/change-password` only — send the
   * user there before anything else.
   */
  requiresPasswordChange?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  userType?: string;
  expiresIn?: number;
  tokenType?: string;
  message?: string;
}
