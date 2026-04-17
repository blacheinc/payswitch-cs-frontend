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
  TimeseriesPoint,
  ScoreDistributionBucket,
  FairnessMetric,
} from "@/types/monitoring-types";

const RISK_GRADE_KEY = /^[A-F]$/i;

function normalizeRiskGradeKey(key: string): string | null {
  const t = key.trim();
  if (!RISK_GRADE_KEY.test(t)) return null;
  return t.toUpperCase();
}

/** API may return an array of buckets or a map keyed by grade (A–F). */
function asScoreDistributionArray(raw: unknown): ScoreDistributionBucket[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (b): b is Record<string, unknown> =>
          b != null && typeof b === "object",
      )
      .map((b) => {
        const rawGrade = b.grade ?? b.bucket ?? b.label;
        let grade = "";
        if (typeof rawGrade === "string") {
          grade = normalizeRiskGradeKey(rawGrade) ?? rawGrade.trim();
        } else if (rawGrade != null) {
          grade = String(rawGrade);
        }
        const count =
          typeof b.count === "number" ? b.count : Number(b.count) || 0;
        const percentage =
          typeof b.percentage === "number"
            ? b.percentage
            : typeof b.percent === "number"
              ? b.percent
              : Number(b.percentage ?? b.percent) || 0;
        return { grade, count, percentage } as ScoreDistributionBucket;
      })
      .filter((b) => b.grade.length > 0);
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.buckets))
      return asScoreDistributionArray(o.buckets);
    if (Array.isArray(o.items)) return asScoreDistributionArray(o.items);
    if (Array.isArray(o.data)) return asScoreDistributionArray(o.data);
    const out: ScoreDistributionBucket[] = [];
    for (const [key, val] of Object.entries(o)) {
      const grade = normalizeRiskGradeKey(key);
      if (!grade) continue;
      if (typeof val === "number" && !Number.isNaN(val)) {
        out.push({ grade, count: val, percentage: 0 });
        continue;
      }
      if (val != null && typeof val === "object" && !Array.isArray(val)) {
        const v = val as Record<string, unknown>;
        const count =
          typeof v.count === "number" ? v.count : Number(v.count) || 0;
        const percentage =
          typeof v.percentage === "number"
            ? v.percentage
            : typeof v.percent === "number"
              ? v.percent
              : Number(v.percentage ?? v.percent) || 0;
        out.push({ grade, count, percentage });
      }
    }
    return out.sort((a, b) => a.grade.localeCompare(b.grade));
  }
  return [];
}

function asTimeseriesArray(raw: unknown): TimeseriesPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (p): p is TimeseriesPoint =>
      p != null &&
      typeof p === "object" &&
      "timestamp" in p &&
      typeof (p as TimeseriesPoint).timestamp === "string",
  ) as TimeseriesPoint[];
}

function normalizeAlertsPayload(raw: unknown): AlertItem[] {
  if (Array.isArray(raw)) return raw as AlertItem[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as AlertItem[];
    if (Array.isArray(o.alerts)) return o.alerts as AlertItem[];
  }
  return [];
}

function normalizeFairnessStatus(raw: unknown): FairnessMetric["status"] {
  if (typeof raw !== "string") return "pass";
  const s = raw.toLowerCase().trim();
  if (s === "pass" || s === "warning" || s === "fail") return s;
  return "pass";
}

function readDisparateImpact(v: Record<string, unknown>): number | null {
  const diRaw =
    v.disparate_impact ?? v.disparate_impact_ratio ?? v.disp_impact;
  if (diRaw == null || diRaw === "") return null;
  if (typeof diRaw === "number" && !Number.isNaN(diRaw)) return diRaw;
  const n = Number(diRaw);
  return Number.isNaN(n) ? null : n;
}

/** API may return an array or a map keyed by attribute name. */
function asFairnessMetricsArray(raw: unknown): FairnessMetric[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (m): m is Record<string, unknown> =>
          m != null && typeof m === "object",
      )
      .map((m) => {
        const attribute = String(
          m.attribute ?? m.name ?? m.dimension ?? m.group ?? "",
        ).trim();
        const di = readDisparateImpact(m);
        const disparate_impact = di ?? 0;
        const status = normalizeFairnessStatus(m.status ?? m.result);
        return {
          ...m,
          attribute,
          disparate_impact,
          status,
        } as FairnessMetric;
      })
      .filter((m) => m.attribute.length > 0);
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.items)) return asFairnessMetricsArray(o.items);
    if (Array.isArray(o.metrics)) return asFairnessMetricsArray(o.metrics);
    if (Array.isArray(o.data)) return asFairnessMetricsArray(o.data);
    if (Array.isArray(o.rows)) return asFairnessMetricsArray(o.rows);
    const out: FairnessMetric[] = [];
    for (const [key, val] of Object.entries(o)) {
      if (val == null) continue;
      if (typeof val === "number" && !Number.isNaN(val)) {
        out.push({
          attribute: key,
          disparate_impact: val,
          status: "pass",
        });
        continue;
      }
      if (typeof val === "object" && !Array.isArray(val)) {
        const v = val as Record<string, unknown>;
        const di = readDisparateImpact(v);
        const hasSignal =
          di != null ||
          v.status != null ||
          v.result != null ||
          v.attribute != null;
        if (!hasSignal) continue;
        const attribute = String(
          v.attribute ?? v.name ?? key,
        ).trim();
        if (!attribute) continue;
        const disparate_impact = di ?? 0;
        const status = normalizeFairnessStatus(v.status ?? v.result);
        out.push({ ...v, attribute, disparate_impact, status });
      }
    }
    return out;
  }
  return [];
}

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
    const raw = (response.data ?? {}) as Record<string, unknown>;
    return {
      ...(raw as InfrastructureDashboard),
      period: (raw.period as string) ?? params?.period ?? "24h",
      summary: (raw.summary as InfrastructureDashboard["summary"]) ?? {},
      endpoints: (raw.endpoints as InfrastructureDashboard["endpoints"]) ?? [],
      latency_timeseries: asTimeseriesArray(raw.latency_timeseries),
      error_rate_timeseries: asTimeseriesArray(raw.error_rate_timeseries),
      request_volume_timeseries: asTimeseriesArray(
        raw.request_volume_timeseries,
      ),
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
    const raw = (response.data ?? {}) as Record<string, unknown>;
    return {
      ...(raw as RiskDashboard),
      period: (raw.period as string) ?? params?.period ?? "7d",
      summary: (raw.summary as RiskDashboard["summary"]) ?? {},
      score_distribution: asScoreDistributionArray(raw.score_distribution),
      approval_rate_timeseries: asTimeseriesArray(raw.approval_rate_timeseries),
      delinquency_timeseries: asTimeseriesArray(raw.delinquency_timeseries),
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
    const raw = (response.data ?? {}) as Record<string, unknown>;
    return {
      ...(raw as ModelOpsDashboard),
      period: (raw.period as string) ?? params?.period ?? "30d",
      model_type: raw.model_type as string | undefined,
      champion: (raw.champion as ModelOpsDashboard["champion"]) ?? {},
      drift_metrics:
        (raw.drift_metrics as ModelOpsDashboard["drift_metrics"]) ?? [],
      retraining_history:
        (raw.retraining_history as ModelOpsDashboard["retraining_history"]) ??
        [],
      performance_timeseries: asTimeseriesArray(raw.performance_timeseries),
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
    const raw = (response.data ?? {}) as Record<string, unknown>;
    return {
      ...(raw as ComplianceDashboard),
      period: (raw.period as string) ?? params?.period ?? "30d",
      summary: (raw.summary as ComplianceDashboard["summary"]) ?? {},
      fairness_metrics: asFairnessMetricsArray(raw.fairness_metrics),
      data_quality_timeseries: asTimeseriesArray(raw.data_quality_timeseries),
    };
  },

  async getAlerts(params?: AlertsParams): Promise<AlertItem[]> {
    const limit = Math.min(Math.max(params?.limit ?? 50, 1), 200);
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.ALERTS, {
      params: {
        status: params?.status || undefined,
        severity: params?.severity || undefined,
        limit,
      },
    });
    return normalizeAlertsPayload(response.data);
  },
};
