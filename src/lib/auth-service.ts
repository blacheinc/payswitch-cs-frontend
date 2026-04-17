import apiClient from "./api-client";
import type { AdminUser, User } from "@/types/models";
import type {
  AuthResult,
  Setup2FAResponse,
  UserPermissionsResponse,
  UserProfileResponse,
} from "@/types/auth-type";
import { API_ENDPOINTS } from "@/lib/constant";

/** Merge stored session user with GET /auth/me (profile + resolved `permissions`). */
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
    const { isAdmin: _a, adminRole: _r, ...orgShape } = asAdmin;
    return orgShape as User;
  }

  return next;
}

// Removed parseJwt safely as we will now fetch profiles directly using /auth/me
// ---- Raw API response types (snake_case, matching backend) ----

interface ApiLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_type: string;
  requires_2fa?: boolean;
  email?: string | null;
}

interface Api2FAResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  message?: string;
}

/** POST /auth/refresh → only returns a new access_token (no refresh_token rotation) */
interface ApiTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ApiSetup2FAResponse {
  secret: string;
  uri: string;
  message: string;
  temp_token: string;
}

// ---- Service ----

export const authService = {
  // POST /auth/login
  async login(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const response = await apiClient.post<ApiLoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
    );
    const data = response.data;

    if (data?.requires_2fa) {
      return {
        requires2FA: true,
        accessToken: data?.access_token, // temp token for 2FA
        userType: data?.user_type,
      };
    }

    const userProfile = await authService.getMe(data?.access_token);
    const permissions = userProfile?.permissions ?? [];

    const baseUser: User = {
      id: userProfile?.id,
      email: data?.email || userProfile?.email || credentials?.email,
      name: userProfile?.name,
      roleLabel: userProfile?.role as User["roleLabel"],
      status: userProfile?.status as User["status"],
      createdAt: userProfile?.created_at || new Date().toISOString(),
      permissions,
    };

    if (userProfile?.organization_id) {
      baseUser.organizationId = userProfile?.organization_id;
    }

    const isAdminUser =
      data?.user_type === "admin" || userProfile?.user_type === "admin";
    const user: User = isAdminUser
      ? ({
          ...baseUser,
          isAdmin: true,
          adminRole: "super_admin",
        } as AdminUser)
      : baseUser;

    return {
      requires2FA: false,
      accessToken: data?.access_token,
      refreshToken: data?.refresh_token,
      tokenType: data?.token_type,
      expiresIn: data?.expires_in,
      user,
      userType: data?.user_type,
    };
  },

  // POST /auth/2fa/verify — spec requires { code, temp_token }
  async verify2FA(data: {
    code: string;
    tempToken: string;
  }): Promise<AuthResult> {
    const payload = {
      code: data.code,
      temp_token: data.tempToken,
    };

    const response = await apiClient.post<Api2FAResponse>(
      API_ENDPOINTS.AUTH.VERIFY_2FA,
      payload,
    );

    const userProfile = await authService.getMe(response?.data?.access_token);
    const permissions = userProfile?.permissions ?? [];

    const baseUser: User = {
      id: userProfile?.id,
      email: userProfile?.email,
      name: userProfile?.name,
      roleLabel: userProfile?.role as User["roleLabel"],
      status: userProfile?.status as User["status"],
      createdAt: userProfile?.created_at || new Date().toISOString(),
      permissions,
    };

    if (userProfile?.organization_id) {
      baseUser.organizationId = userProfile?.organization_id;
    }

    const userType =
      userProfile?.user_type ||
      (userProfile?.organization_id ? "org_user" : "admin");

    const isAdminUser = userType === "admin" || userProfile?.user_type === "admin";
    const user: User = isAdminUser
      ? ({
          ...baseUser,
          isAdmin: true,
          adminRole: "super_admin",
        } as AdminUser)
      : baseUser;

    return {
      accessToken: response?.data?.access_token,
      refreshToken: response?.data?.refresh_token,
      tokenType: response?.data?.token_type,
      expiresIn: response?.data?.expires_in,
      message: response?.data?.message,
      user,
      userType,
    };
  },

  // GET /auth/me → UserProfileResponse (authenticated)
  async getMe(accessToken?: string): Promise<UserProfileResponse> {
    const headers = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined;
    const response = await apiClient.get<UserProfileResponse>(
      API_ENDPOINTS.AUTH.ME,
      { headers },
    );
    return response?.data;
  },

  /** GET /auth/me/permissions — resolved codes only (e.g. after role change). */
  async getMyPermissions(): Promise<UserPermissionsResponse> {
    const response = await apiClient.get<UserPermissionsResponse>(
      API_ENDPOINTS.AUTH.ME_PERMISSIONS,
    );
    return response?.data;
  },

  // POST /auth/logout → SuccessResponse
  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.LOGOUT,
    );
    return response?.data;
  },

  // POST /auth/refresh → TokenResponse (no refresh_token rotation)
  async refreshToken(
    token: string,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiClient.post<ApiTokenResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: token },
    );

    return {
      accessToken: response?.data?.access_token,
      expiresIn: response?.data?.expires_in,
    };
  },

  // POST /auth/forgot-password → SuccessResponse
  async forgotPassword(
    email: string,
    callbackUrl?: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      {
        email,
        callback_url: callbackUrl,
      },
    );
    return response?.data;
  },

  // POST /auth/reset-password → SuccessResponse
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      {
        token,
        new_password: password,
      },
    );
    return response?.data;
  },

  // POST /auth/verify-email → SuccessResponse
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token },
    );
    return response?.data;
  },

  // POST /auth/change-password → SuccessResponse (authenticated)
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
    );
    return response?.data;
  },

  // POST /auth/2fa/setup → Setup2FAResponse (authenticated)
  async setup2FA(): Promise<Setup2FAResponse> {
    const response = await apiClient.post<ApiSetup2FAResponse>(
      API_ENDPOINTS.AUTH.SETUP_2FA,
    );
    return {
      secret: response?.data?.secret,
      uri: response?.data?.uri,
      message: response?.data?.message,
      tempToken: response?.data?.temp_token,
    };
  },

  // POST /auth/2fa/remove → SuccessResponse (authenticated)
  async remove2FA(
    data: import("@/types/auth-type").Remove2FARequest,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.REMOVE_2FA,
      data,
    );
    return response?.data;
  },
};
