import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import type { PaginatedResponse } from "@/types/api-type";
import type {
  ChampionModelsResponse,
  RuleEvaluateRequest,
  RuleEvaluateResponse,
  InfrastructureResponse,
  InfrastructureParams,
  RiskResponse,
  RiskParams,
  ModelOpsResponse,
  ModelOpsParams,
  ComplianceResponse,
  ComplianceParams,
  AlertsResponse,
  AlertsParams,
  PlatformApiLogEntry,
  PlatformApiLogFilters,
} from "@/types/monitoring-types";

interface RawPlatformApiLogEntry {
  id: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number | null;
  ip_address: string | null;
  error_message: string | null;
  created_at: string;
  actor?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface RawPaginatedPlatformApiLogs {
  items: RawPlatformApiLogEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

function mapPlatformApiLog(raw: RawPlatformApiLogEntry): PlatformApiLogEntry {
  return {
    id: raw.id,
    method: raw.method,
    path: raw.path,
    statusCode: raw.status_code,
    responseTimeMs: raw.response_time_ms ?? null,
    ipAddress: raw.ip_address ?? null,
    errorMessage: raw.error_message ?? null,
    createdAt: raw.created_at,
    actor: raw.actor
      ? {
          id: raw.actor.id ?? null,
          name: raw.actor.name ?? null,
          email: raw.actor.email ?? null,
        }
      : null,
  };
}

// ---- Query-key factories ----

export const MODEL_KEYS = {
  all: ["models"] as const,
  current: () => [...MODEL_KEYS.all, "current"] as const,
};

export const RULES_KEYS = {
  all: ["rules"] as const,
  evaluate: () => [...RULES_KEYS.all, "evaluate"] as const,
};

export const MONITORING_KEYS = {
  all: ["monitoring"] as const,
  infrastructure: (params?: InfrastructureParams) =>
    [...MONITORING_KEYS.all, "infrastructure", params] as const,
  risk: (params?: RiskParams) =>
    [...MONITORING_KEYS.all, "risk", params] as const,
  modelOps: (params?: ModelOpsParams) =>
    [...MONITORING_KEYS.all, "model-ops", params] as const,
  compliance: (params?: ComplianceParams) =>
    [...MONITORING_KEYS.all, "compliance", params] as const,
  alerts: (params?: AlertsParams) =>
    [...MONITORING_KEYS.all, "alerts", params] as const,
  platformLogs: (filters?: PlatformApiLogFilters) =>
    [...MONITORING_KEYS.all, "platform-logs", filters] as const,
};

// ---- Services ----

export const modelService = {
  async getChampionModels(): Promise<ChampionModelsResponse> {
    const response = await apiClient.get<ChampionModelsResponse>(
      API_ENDPOINTS.MODELS.CURRENT,
    );
    return response.data;
  },
};

export const rulesService = {
  async evaluate(payload: RuleEvaluateRequest): Promise<RuleEvaluateResponse> {
    const response = await apiClient.post<RuleEvaluateResponse>(
      API_ENDPOINTS.RULES.EVALUATE,
      payload,
    );
    return response.data;
  },
};

export const monitoringService = {
  async getInfrastructure(
    params?: InfrastructureParams,
  ): Promise<InfrastructureResponse> {
    const response = await apiClient.get<InfrastructureResponse>(
      API_ENDPOINTS.MONITORING.INFRASTRUCTURE,
      {
        params: {
          period: params?.period ?? "24h",
          endpoint: params?.endpoint?.trim() || undefined,
        },
      },
    );
    return response.data;
  },

  async getRisk(params?: RiskParams): Promise<RiskResponse> {
    const response = await apiClient.get<RiskResponse>(
      API_ENDPOINTS.MONITORING.RISK,
      {
        params: {
          period: params?.period ?? "7d",
          segment: params?.segment || undefined,
        },
      },
    );
    return response.data;
  },

  async getModelOps(params?: ModelOpsParams): Promise<ModelOpsResponse> {
    const response = await apiClient.get<ModelOpsResponse>(
      API_ENDPOINTS.MONITORING.MODEL_OPS,
      {
        params: {
          period: params?.period ?? "30d",
          model_type: params?.model_type || undefined,
        },
      },
    );
    return response.data;
  },

  async getCompliance(params?: ComplianceParams): Promise<ComplianceResponse> {
    const response = await apiClient.get<ComplianceResponse>(
      API_ENDPOINTS.MONITORING.COMPLIANCE,
      {
        params: {
          period: params?.period ?? "30d",
        },
      },
    );
    return response.data;
  },

  async getPlatformApiLogs(
    filters?: PlatformApiLogFilters,
  ): Promise<PaginatedResponse<PlatformApiLogEntry>> {
    const response = await apiClient.get<RawPaginatedPlatformApiLogs>(
      API_ENDPOINTS.ADMIN.API_LOGS,
      {
        params: {
          page: filters?.page,
          per_page: filters?.perPage ?? TABLE_ITEM_PER_PAGE,
          method: filters?.method || undefined,
          status_code: filters?.statusCode || undefined,
          status_class: filters?.statusClass || undefined,
          path: filters?.path?.trim() || undefined,
          from_date: filters?.fromDate || undefined,
          to_date: filters?.toDate || undefined,
        },
      },
    );
    const data = response.data;
    return {
      items: (data?.items ?? []).map(mapPlatformApiLog),
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      perPage: data?.per_page ?? TABLE_ITEM_PER_PAGE,
      totalPages: data?.total_pages ?? 1,
    };
  },

  async getAlerts(params?: AlertsParams): Promise<AlertsResponse> {
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
    const response = await apiClient.get<AlertsResponse>(
      API_ENDPOINTS.MONITORING.ALERTS,
      {
        params: {
          status: params?.status || undefined,
          severity: params?.severity || undefined,
          limit,
        },
      },
    );
    return response.data;
  },
};
