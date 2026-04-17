import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import type { PaginatedResponse, PaginationParams } from "@/types/api-type";
import type {
  OrgUserResponse,
  InviteUserRequest,
  UpdateUserRequest,
} from "@/types/organization-type";

// ---- Raw API shapes (snake_case) ----

interface ApiOrgUserResponse {
  id: string;
  email: string;
  name: string;
  role_label: string;
  role_id?: string | null;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

interface ApiPaginatedUsers {
  items: ApiOrgUserResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ---- Mapper ----

function mapUser(raw: ApiOrgUserResponse): OrgUserResponse {
  return {
    id: raw?.id,
    email: raw?.email,
    name: raw?.name,
    roleLabel: raw?.role_label,
    roleId: raw?.role_id ?? undefined,
    status: raw?.status,
    lastLoginAt: raw?.last_login_at,
    createdAt: raw?.created_at,
  };
}

// ---- Query keys ----

export const USER_MGMT_KEYS = {
  all: ["user-management"] as const,
  list: (params?: PaginationParams) =>
    [...USER_MGMT_KEYS.all, "list", params] as const,
};

// ---- Service ----

export const userManagementService = {
  /** GET /org/users — paginated list of org members */
  async list(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<OrgUserResponse>> {
    const response = await apiClient.get<ApiPaginatedUsers>(
      API_ENDPOINTS.ORG.USERS,
      {
        params: {
          page: params?.page,
          per_page: TABLE_ITEM_PER_PAGE,
        },
      },
    );

    const data = response?.data;
    return {
      items: data?.items?.map(mapUser) || [],
      total: data?.total,
      page: data?.page,
      perPage: data?.per_page,
      totalPages: data?.total_pages,
    };
  },

  /** POST /org/users — invite a new user to the organization */
  async invite(data: InviteUserRequest): Promise<OrgUserResponse> {
    const response = await apiClient.post<ApiOrgUserResponse>(
      API_ENDPOINTS.ORG.USERS,
      {
        email: data.email,
        name: data.name,
        role_id: data.roleId,
        callback_url: data.callbackUrl || undefined,
      },
    );
    return mapUser(response?.data);
  },

  /** PATCH /org/users/{user_id} — update a user's name or role */
  async update(
    userId: string,
    data: UpdateUserRequest,
  ): Promise<OrgUserResponse> {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.roleId !== undefined) {
      body.role_id =
        data.roleId === null || data.roleId === "" ? null : data.roleId;
    }
    const response = await apiClient.patch<ApiOrgUserResponse>(
      API_ENDPOINTS.ORG.USER_BY_ID(userId),
      body,
    );
    return mapUser(response?.data);
  },

  /** POST /org/users/{user_id}/suspend — suspend a user */
  async suspend(userId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ORG.SUSPEND_USER(userId),
    );
    return response?.data;
  },

  /** POST /org/users/{user_id}/activate — re-activate a suspended user */
  async activate(userId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ORG.ACTIVATE_USER(userId),
    );
    return response?.data;
  },

  /** DELETE /org/users/{user_id} — remove a user from the organization */
  async remove(userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.ORG.USER_BY_ID(userId),
    );
    return response?.data;
  },
};
