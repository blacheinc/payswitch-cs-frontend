import apiClient from "./api-client";
import { API_ENDPOINTS } from "@/lib/constant";
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
} from "@/types/monitoring-types";

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
