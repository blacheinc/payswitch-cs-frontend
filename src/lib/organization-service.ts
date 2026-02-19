import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import type { PaginatedResponse, PaginationParams } from "@/types/api-type";
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  ProvisionOrganizationRequest,
  SuspendOrganizationRequest,
  OrganizationResponse,
  ProvisionResponse,
  OrgUserResponse,
} from "@/types/organization-type";

// ---- Raw API shapes (snake_case) ----

interface ApiOrganizationResponse {
  id: string;
  name: string;
  short_name: string;
  industry_type: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  address: string | null;
  status: string;
  suspension_reason: string | null;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiPaginatedOrgs {
  items: ApiOrganizationResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiProvisionResponse {
  organization: ApiOrganizationResponse;
  admin_email: string;
  sandbox_api_key: string;
  production_api_key: string;
  message: string;
}

interface ApiOrgUserResponse {
  id: string;
  email: string;
  name: string;
  role_label: string;
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

// ---- Mappers ----

function mapOrg(raw: ApiOrganizationResponse): OrganizationResponse {
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name,
    industryType: raw.industry_type,
    primaryContactName: raw.primary_contact_name,
    primaryContactEmail: raw.primary_contact_email,
    primaryContactPhone: raw.primary_contact_phone,
    address: raw.address,
    status: raw.status,
    suspensionReason: raw.suspension_reason,
    webhookSecret: raw.webhook_secret,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function mapUser(raw: ApiOrgUserResponse): OrgUserResponse {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    roleLabel: raw.role_label,
    status: raw.status,
    lastLoginAt: raw.last_login_at,
    createdAt: raw.created_at,
  };
}

// ---- Query keys ----

export const ORG_KEYS = {
  all: ["organizations"] as const,
  list: (params?: PaginationParams) =>
    [...ORG_KEYS.all, "list", params] as const,
  detail: (id: string) => [...ORG_KEYS.all, "detail", id] as const,
  users: (orgId: string, params?: PaginationParams) =>
    [...ORG_KEYS.all, "users", orgId, params] as const,
};

// ---- Service ----

export const organizationService = {
  /** GET /admin/organizations — paginated list */
  async list(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<OrganizationResponse>> {
    const response = await apiClient.get<ApiPaginatedOrgs>(
      API_ENDPOINTS.ADMIN.ORGANIZATIONS,
      {
        params: {
          page: params?.page,
          per_page: TABLE_ITEM_PER_PAGE,
          search: params?.search || undefined,
          status: params?.status || undefined,
        },
      },
    );

    const data = response.data;
    return {
      items: data.items.map(mapOrg),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    };
  },

  /** GET /admin/organizations/{org_id} */
  async getById(id: string): Promise<OrganizationResponse> {
    const response = await apiClient.get<ApiOrganizationResponse>(
      `${API_ENDPOINTS.ADMIN.ORGANIZATIONS}/${id}`,
    );
    return mapOrg(response.data);
  },

  /** POST /admin/organizations */
  async create(data: CreateOrganizationRequest): Promise<OrganizationResponse> {
    const response = await apiClient.post<ApiOrganizationResponse>(
      API_ENDPOINTS.ADMIN.ORGANIZATIONS,
      {
        name: data.name,
        short_name: data.shortName,
        industry_type: data.industryType,
        primary_contact_name: data.primaryContactName,
        primary_contact_email: data.primaryContactEmail,
        primary_contact_phone: data.primaryContactPhone,
        address: data.address,
      },
    );
    return mapOrg(response.data);
  },

  /** PATCH /admin/organizations/{org_id} */
  async update(
    id: string,
    data: UpdateOrganizationRequest,
  ): Promise<OrganizationResponse> {
    const response = await apiClient.patch<ApiOrganizationResponse>(
      `${API_ENDPOINTS.ADMIN.ORGANIZATIONS}/${id}`,
      {
        name: data.name,
        primary_contact_name: data.primaryContactName,
        primary_contact_email: data.primaryContactEmail,
        primary_contact_phone: data.primaryContactPhone,
        address: data.address,
      },
    );
    return mapOrg(response.data);
  },

  /** POST /admin/organizations/{org_id}/provision */
  async provision(
    id: string,
    data?: ProvisionOrganizationRequest,
  ): Promise<ProvisionResponse> {
    const response = await apiClient.post<ApiProvisionResponse>(
      API_ENDPOINTS.ADMIN.PROVISION(id),
      data ? { callback_url: data.callbackUrl } : undefined,
    );

    const raw = response.data;
    return {
      organization: mapOrg(raw.organization),
      adminEmail: raw.admin_email,
      sandboxApiKey: raw.sandbox_api_key,
      productionApiKey: raw.production_api_key,
      message: raw.message,
    };
  },

  /** POST /admin/organizations/{org_id}/suspend */
  async suspend(
    id: string,
    data: SuspendOrganizationRequest,
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.SUSPEND(id),
      { reason: data.reason },
    );
    return response.data;
  },

  /** POST /admin/organizations/{org_id}/activate */
  async activate(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.ADMIN.ACTIVATE(id),
    );
    return response.data;
  },

  /** GET /admin/organizations/{org_id}/users — paginated list */
  async listUsers(
    orgId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<OrgUserResponse>> {
    const response = await apiClient.get<ApiPaginatedUsers>(
      API_ENDPOINTS.ADMIN.ORG_USERS(orgId),
      {
        params: {
          page: params?.page,
          per_page: TABLE_ITEM_PER_PAGE,
          status: params?.status || undefined,
        },
      },
    );

    const data = response.data;
    return {
      items: data.items.map(mapUser),
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
    };
  },
};
