import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import type { PaginatedResponse } from "@/types/api-type";

// ===================== API LOG TYPES =====================

export interface ApiLogEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  apiKeyPrefix: string | null;
  ipAddress: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ApiLogFilters {
  page?: number;
  method?: string | null;
  statusCode?: number | null;
  statusClass?: string | null;
  path?: string | null;
  apiKeyPrefix?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

// ===================== API KEY TYPES =====================

export interface ApiKeyResponse {
  id: string;
  keyPrefix: string;
  name: string;
  environment: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreatedResponse {
  id: string;
  key: string;
  keyPrefix: string;
  name: string;
  environment: string;
  message: string;
}

export interface CreateApiKeyRequest {
  name: string;
  environment: string; // "sandbox" | "production"
}

// ===================== WEBHOOK TYPES =====================

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  label: string;
  description: string;
}

export interface CreateWebhookRequest {
  url: string;
  events?: string[];
  description?: string | null;
}

export interface UpdateWebhookRequest {
  url?: string | null;
  events?: string[] | null;
  isActive?: boolean | null;
  description?: string | null;
}

// ===================== RAW API SHAPES (snake_case) =====================

interface ApiRawLogEntry {
  id: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  api_key_prefix: string | null;
  ip_address: string | null;
  error_message: string | null;
  created_at: string;
}

interface ApiPaginatedLogs {
  items: ApiRawLogEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiRawKeyResponse {
  id: string;
  key_prefix: string;
  name: string;
  environment: string;
  status: string;
  last_used_at: string | null;
  created_at: string;
}

interface ApiRawKeyCreatedResponse {
  id: string;
  key: string;
  key_prefix: string;
  name: string;
  environment: string;
  message: string;
}

interface ApiRawWebhookResponse {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  created_at: string;
}

// ===================== MAPPERS =====================

function mapLogEntry(raw: ApiRawLogEntry): ApiLogEntry {
  return {
    id: raw?.id,
    method: raw?.method,
    path: raw?.path,
    statusCode: raw?.status_code,
    responseTimeMs: raw?.response_time_ms,
    apiKeyPrefix: raw?.api_key_prefix,
    ipAddress: raw?.ip_address,
    errorMessage: raw?.error_message,
    createdAt: raw?.created_at,
  };
}

function mapApiKey(raw: ApiRawKeyResponse): ApiKeyResponse {
  return {
    id: raw?.id,
    keyPrefix: raw?.key_prefix,
    name: raw?.name,
    environment: raw?.environment,
    status: raw?.status,
    lastUsedAt: raw?.last_used_at,
    createdAt: raw?.created_at,
  };
}

function mapApiKeyCreated(
  raw: ApiRawKeyCreatedResponse,
): ApiKeyCreatedResponse {
  return {
    id: raw?.id,
    key: raw?.key,
    keyPrefix: raw?.key_prefix,
    name: raw?.name,
    environment: raw?.environment,
    message: raw?.message,
  };
}

function mapWebhook(raw: ApiRawWebhookResponse): WebhookResponse {
  return {
    id: raw?.id,
    url: raw?.url,
    events: raw?.events,
    isActive: raw?.is_active,
    description: raw?.description,
    createdAt: raw?.created_at,
  };
}

// ===================== QUERY KEYS =====================

export const API_LOG_KEYS = {
  all: ["api-logs"] as const,
  list: (filters?: ApiLogFilters) =>
    [...API_LOG_KEYS.all, "list", filters] as const,
};

export const API_KEY_KEYS = {
  all: ["api-keys"] as const,
  list: () => [...API_KEY_KEYS.all, "list"] as const,
};

export const WEBHOOK_KEYS = {
  all: ["webhooks"] as const,
  list: () => [...WEBHOOK_KEYS.all, "list"] as const,
  events: () => [...WEBHOOK_KEYS.all, "events"] as const,
};

// ===================== API LOG SERVICE =====================

export const apiLogService = {
  /** GET /org/api-logs — paginated list of API request logs */
  async list(filters?: ApiLogFilters): Promise<PaginatedResponse<ApiLogEntry>> {
    const response = await apiClient.get<ApiPaginatedLogs>(
      API_ENDPOINTS.ORG.LOGS,
      {
        params: {
          page: filters?.page,
          per_page: TABLE_ITEM_PER_PAGE,
          method: filters?.method || undefined,
          status_code: filters?.statusCode || undefined,
          status_class: filters?.statusClass || undefined,
          path: filters?.path || undefined,
          api_key_prefix: filters?.apiKeyPrefix || undefined,
          from_date: filters?.fromDate || undefined,
          to_date: filters?.toDate || undefined,
        },
      },
    );

    const data = response?.data;
    return {
      items: data?.items?.map(mapLogEntry) || [],
      total: data?.total,
      page: data?.page,
      perPage: data?.per_page,
      totalPages: data?.total_pages,
    };
  },
};

// ===================== API KEY SERVICE =====================

export const apiKeyService = {
  /** GET /org/api-keys — list all API keys for the org */
  async list(): Promise<ApiKeyResponse[]> {
    const response = await apiClient.get<ApiRawKeyResponse[]>(
      API_ENDPOINTS.ORG.API_KEYS,
    );
    return response?.data?.map(mapApiKey) || [];
  },

  /** POST /org/api-keys — generate a new API key */
  async create(data: CreateApiKeyRequest): Promise<ApiKeyCreatedResponse> {
    const response = await apiClient.post<ApiRawKeyCreatedResponse>(
      API_ENDPOINTS.ORG.API_KEYS,
      {
        name: data.name,
        environment: data.environment,
      },
    );
    return mapApiKeyCreated(response?.data);
  },

  /** DELETE /org/api-keys/{key_id} — revoke an API key */
  async revoke(keyId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.ORG.API_KEY_BY_ID(keyId),
    );
    return response?.data;
  },
};

// ===================== WEBHOOK SERVICE =====================

export const webhookService = {
  /** GET /org/webhooks/events — list supported webhook event types */
  async listEvents(): Promise<WebhookEvent[]> {
    const response = await apiClient.get<WebhookEvent[]>(
      API_ENDPOINTS.ORG.WEBHOOK_EVENTS,
    );
    return response?.data || [];
  },

  /** GET /org/webhooks — list all webhooks */
  async list(): Promise<WebhookResponse[]> {
    const response = await apiClient.get<ApiRawWebhookResponse[]>(
      API_ENDPOINTS.ORG.WEBHOOKS,
    );
    return response?.data?.map(mapWebhook) || [];
  },

  /** POST /org/webhooks — create a new webhook */
  async create(data: CreateWebhookRequest): Promise<WebhookResponse> {
    const response = await apiClient.post<ApiRawWebhookResponse>(
      API_ENDPOINTS.ORG.WEBHOOKS,
      {
        url: data.url,
        events: data.events || ["score.completed"],
        description: data.description || undefined,
      },
    );
    return mapWebhook(response?.data);
  },

  /** PATCH /org/webhooks/{webhook_id} — update a webhook */
  async update(
    webhookId: string,
    data: UpdateWebhookRequest,
  ): Promise<WebhookResponse> {
    const response = await apiClient.patch<ApiRawWebhookResponse>(
      API_ENDPOINTS.ORG.WEBHOOK_BY_ID(webhookId),
      {
        url: data.url,
        events: data.events,
        is_active: data.isActive,
        description: data.description,
      },
    );
    return mapWebhook(response?.data);
  },

  /** DELETE /org/webhooks/{webhook_id} — delete a webhook */
  async remove(webhookId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      API_ENDPOINTS.ORG.WEBHOOK_BY_ID(webhookId),
    );
    return response?.data;
  },
};
