import apiClient from "./api-client";
import { API_ENDPOINTS } from "@/lib/constant";
import type {
  PermissionListResponse,
  RoleListResponse,
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
} from "@/types/rbac-types";

// ---- Query key factories ----

export const RBAC_KEYS = {
  all: ["rbac"] as const,
  permissions: () => [...RBAC_KEYS.all, "permissions"] as const,
  roles: () => [...RBAC_KEYS.all, "roles"] as const,
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

  async listRoles(): Promise<RoleListResponse> {
    const response = await apiClient.get<RoleListResponse>(
      API_ENDPOINTS.RBAC.ROLES,
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
