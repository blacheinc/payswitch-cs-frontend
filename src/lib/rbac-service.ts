import apiClient from "./api-client";
import { API_ENDPOINTS } from "@/lib/constant";
import type {
  PermissionListResponse,
  RoleListResponse,
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/rbac-types";

/** Scope filter for `GET /v1/roles?scope=…`. */
export type RoleScope = "platform" | "organization";

// ---- Query key factories ----

export const RBAC_KEYS = {
  all: ["rbac"] as const,
  permissions: () => [...RBAC_KEYS.all, "permissions"] as const,
  roles: (scope?: RoleScope) =>
    scope
      ? ([...RBAC_KEYS.all, "roles", scope] as const)
      : ([...RBAC_KEYS.all, "roles"] as const),
  role: (id: string) => [...RBAC_KEYS.all, "role", id] as const,
};

// ---- Service ----

export const rbacService = {
  async listPermissions(): Promise<PermissionListResponse> {
    const response = await apiClient.get<PermissionListResponse>(
      API_ENDPOINTS.RBAC.PERMISSIONS,
    );
    return response.data;
  },

  /**
   * GET /v1/roles — optionally filtered by scope.
   * - `platform` → seed roles + custom platform roles (admin side)
   * - `organization` → org-scoped system role + custom org roles
   * Omit to use whatever the backend returns for the caller's audience.
   */
  async listRoles(scope?: RoleScope): Promise<RoleListResponse> {
    const response = await apiClient.get<RoleListResponse>(
      API_ENDPOINTS.RBAC.ROLES,
      { params: scope ? { scope } : undefined },
    );
    return response.data;
  },

  async getRole(id: string): Promise<RoleResponse> {
    const response = await apiClient.get<RoleResponse>(
      API_ENDPOINTS.RBAC.ROLE_BY_ID(id),
    );
    return response.data;
  },

  async createRole(data: CreateRoleRequest): Promise<RoleResponse> {
    const response = await apiClient.post<RoleResponse>(
      API_ENDPOINTS.RBAC.ROLES,
      data,
    );
    return response.data;
  },

  async updateRole(
    id: string,
    data: UpdateRoleRequest,
  ): Promise<RoleResponse> {
    const response = await apiClient.patch<RoleResponse>(
      API_ENDPOINTS.RBAC.ROLE_BY_ID(id),
      data,
    );
    return response.data;
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.RBAC.ROLE_BY_ID(id));
  },
};
