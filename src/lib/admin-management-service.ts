import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import type { PaginatedResponse, PaginationParams } from "@/types/api-type";
import type {
  AdminMember,
  AdminStatus,
  InviteAdminRequest,
  UpdateAdminRequest,
} from "@/types/admin-management-type";

// =====================  RAW API SHAPES (snake_case)  =====================

interface ApiAdminMember {
  id: string;
  email: string;
  name: string;
  status: string;
  role_id: string | null;
  role_name: string | null;
  last_login_at: string | null;
  created_at: string;
}

interface ApiPaginatedAdmins {
  items: ApiAdminMember[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// =====================  MAPPERS  =====================

function mapAdmin(raw: ApiAdminMember): AdminMember {
  return {
    id: raw?.id,
    email: raw?.email,
    name: raw?.name,
    status: (raw?.status as AdminStatus) ?? "active",
    roleId: raw?.role_id ?? null,
    roleName: raw?.role_name ?? null,
    lastLoginAt: raw?.last_login_at ?? null,
    createdAt: raw?.created_at,
  };
}

// =====================  QUERY KEYS  =====================

export const ADMIN_MGMT_KEYS = {
  all: ["admin-management"] as const,
  list: (params?: PaginationParams) =>
    [...ADMIN_MGMT_KEYS.all, "list", params] as const,
  detail: (id: string) => [...ADMIN_MGMT_KEYS.all, "detail", id] as const,
};

// =====================  SERVICE  =====================

export const adminManagementService = {
  /** GET /admin/admins — paginated list of platform admins */
  async list(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<AdminMember>> {
    const response = await apiClient.get<ApiPaginatedAdmins>(
      API_ENDPOINTS.ADMIN.ADMINS,
      {
        params: {
          page: params?.page,
          per_page: params?.perPage ?? TABLE_ITEM_PER_PAGE,
        },
      },
    );
    const data = response?.data;
    return {
      items: data?.items?.map(mapAdmin) || [],
      total: data?.total,
      page: data?.page,
      perPage: data?.per_page,
      totalPages: data?.total_pages,
    };
  },

  /** GET /admin/admins/{id} */
  async getById(id: string): Promise<AdminMember> {
    const response = await apiClient.get<ApiAdminMember>(
      API_ENDPOINTS.ADMIN.ADMIN_BY_ID(id),
    );
    return mapAdmin(response?.data);
  },

  /** POST /admin/admins — invite a new platform admin */
  async invite(data: InviteAdminRequest): Promise<AdminMember> {
    const response = await apiClient.post<ApiAdminMember>(
      API_ENDPOINTS.ADMIN.ADMINS,
      {
        email: data.email,
        name: data.name,
        role_id: data.roleId || undefined,
        callback_url: data.callbackUrl || undefined,
      },
    );
    return mapAdmin(response?.data);
  },

  /** PATCH /admin/admins/{id} — update name or reassign role */
  async update(id: string, data: UpdateAdminRequest): Promise<AdminMember> {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.roleId !== undefined) body.role_id = data.roleId || null;
    const response = await apiClient.patch<ApiAdminMember>(
      API_ENDPOINTS.ADMIN.ADMIN_BY_ID(id),
      body,
    );
    return mapAdmin(response?.data);
  },

  /** POST /admin/admins/{id}/suspend — deactivate */
  async suspend(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.SUSPEND_ADMIN(id),
    );
    return response?.data;
  },

  /** POST /admin/admins/{id}/activate — reactivate */
  async activate(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.ACTIVATE_ADMIN(id),
    );
    return response?.data;
  },

  /** DELETE /admin/admins/{id} — soft delete (detaches role) */
  async remove(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.ADMIN.ADMIN_BY_ID(id),
    );
    return response?.data;
  },
};
