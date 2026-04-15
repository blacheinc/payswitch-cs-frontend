import apiClient from "./api-client";
import { API_ENDPOINTS } from "@/lib/constant";
import type {
  ChampionModelsResponse,
  RuleEvaluateRequest,
  RuleEvaluateResponse,
  InfrastructureDashboard,
  InfrastructureParams,
  RiskDashboard,
  RiskParams,
  ModelOpsDashboard,
  ModelOpsParams,
  ComplianceDashboard,
  MonitoringPeriodParams,
  AlertItem,
  AlertsParams,
} from "@/types/monitoring-types";

// ---- Query key factories ----

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
  compliance: (params?: MonitoringPeriodParams) =>
    [...MONITORING_KEYS.all, "compliance", params] as const,
  alerts: (params?: AlertsParams) =>
    [...MONITORING_KEYS.all, "alerts", params] as const,
};

// ---- Service ----

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
  ): Promise<InfrastructureDashboard> {
    const response = await apiClient.get(
      API_ENDPOINTS.MONITORING.INFRASTRUCTURE,
      {
        params: {
          period: params?.period || "24h",
          endpoint: params?.endpoint || undefined,
        },
      },
    );
    const raw = response.data ?? {};
    return {
      ...raw,
      period: raw.period ?? params?.period ?? "24h",
      summary: raw.summary ?? {},
      endpoints: raw.endpoints ?? [],
    };
  },

  async getRisk(params?: RiskParams): Promise<RiskDashboard> {
    const response = await apiClient.get(
      API_ENDPOINTS.MONITORING.RISK,
      {
        params: {
          period: params?.period || "7d",
          segment: params?.segment || undefined,
        },
      },
    );
    const raw = response.data ?? {};
    return {
      ...raw,
      period: raw.period ?? params?.period ?? "7d",
      summary: raw.summary ?? {},
      score_distribution: raw.score_distribution ?? [],
    };
  },

  async getModelOps(params?: ModelOpsParams): Promise<ModelOpsDashboard> {
    const response = await apiClient.get(
      API_ENDPOINTS.MONITORING.MODEL_OPS,
      {
        params: {
          model_type: params?.model_type || undefined,
          period: params?.period || "30d",
        },
      },
    );
    const raw = response.data ?? {};
    return {
      ...raw,
      period: raw.period ?? params?.period ?? "30d",
      champion: raw.champion ?? {},
      drift_metrics: raw.drift_metrics ?? [],
      retraining_history: raw.retraining_history ?? [],
    };
  },

  async getCompliance(
    params?: MonitoringPeriodParams,
  ): Promise<ComplianceDashboard> {
    const response = await apiClient.get(
      API_ENDPOINTS.MONITORING.COMPLIANCE,
      {
        params: {
          period: params?.period || "30d",
        },
      },
    );
    const raw = response.data ?? {};
    return {
      ...raw,
      period: raw.period ?? params?.period ?? "30d",
      summary: raw.summary ?? {},
      fairness_metrics: raw.fairness_metrics ?? [],
    };
  },

  async getAlerts(params?: AlertsParams): Promise<AlertItem[]> {
    const response = await apiClient.get(
      API_ENDPOINTS.MONITORING.ALERTS,
      {
        params: {
          status: params?.status || undefined,
          severity: params?.severity || undefined,
          limit: params?.limit || 50,
        },
      },
    );
    const raw = response.data;
    return Array.isArray(raw) ? raw : [];
  },
};
