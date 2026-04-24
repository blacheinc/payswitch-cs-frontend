// Monitoring / Model / Rules types.
// Shapes track the FE integration guide (fe_monitoring_integration_guide.md)
// and the OpenAPI spec — snake_case is preserved at the API boundary.

// ==================== MODEL ====================

export interface ChampionModelEntry {
  model_type: string;
  registry_name: string;
  version: string;
  status: string;
  created_at?: string;
  metrics: Record<string, number>;
  tags?: Record<string, string>;
  error?: string;
}

export interface ChampionModelsResponse {
  updated_at: string;
  models: ChampionModelEntry[];
}

// ==================== RULES ====================

export type ScoreGrade = "A" | "B" | "C" | "D" | "E" | "F";

export interface RuleEvaluateRequest {
  probability_of_default: number;
  score_grade: ScoreGrade | string;
  data_engineer_decision_label?: string | null;
  fraud_risk_flag?: string | null;
  recommended_loan_amount_ghs?: number | null;
  features?: Record<string, number | null> | null;
  metadata?: Record<string, unknown> | null;
}

export interface TriggeredRule {
  rule?: string;
  rule_id?: string;
  rule_name?: string;
  result?: string;
  details?: string;
  [key: string]: unknown;
}

export interface RuleEvaluateResponse {
  decision: string;
  conditions?: string[];
  risk_tier?: string;
  rules_applied?: TriggeredRule[];
  /** Legacy alias for `rules_applied` — some backends still emit this key. */
  triggered_rules?: TriggeredRule[];
  /** Legacy alias for `conditions` — older response shape. */
  conditions_applied?: string[];
  decline_reasons?: string[];
  [key: string]: unknown;
}

// ==================== MONITORING: SHARED ====================

export type AlertStatus = "ok" | "firing" | "resolved";
export type AlertSeverity = "warning" | "critical";

export interface AlertItem {
  metric: string;
  current_value: number;
  threshold: number;
  status: AlertStatus | string;
  feature?: string | null;
  model_type?: string | null;
  [key: string]: unknown;
}

// ==================== MONITORING: INFRASTRUCTURE ====================

export interface InfraRequestsByEndpoint {
  endpoint: string;
  method: string;
  count: number;
}

export interface InfraLatencyByEndpoint {
  endpoint: string;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
}

export interface InfraErrorByStatus {
  status_code: number;
  count: number;
  pct: number;
}

export interface InfraTimeseriesPoint {
  bucket: string;
  requests: number;
  errors: number;
  p99_ms: number;
}

export interface InfrastructureResponse {
  period: string;
  generated_at: string;
  request_volume: {
    total: number;
    by_endpoint: InfraRequestsByEndpoint[];
  };
  latency: {
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    by_endpoint: InfraLatencyByEndpoint[];
  };
  error_rates: {
    overall_pct: number;
    by_status: InfraErrorByStatus[];
  };
  timeseries: InfraTimeseriesPoint[];
  alerts: AlertItem[];
}

// ==================== MONITORING: RISK ====================

export interface RiskOverall {
  total_decisions: number;
  approve: number;
  conditional_approve: number;
  decline: number;
  refer: number;
  error: number;
  approve_rate_pct: number;
  conditional_approve_rate_pct: number;
  decline_rate_pct: number;
}

export interface RiskByGrade {
  grade: string;
  total: number;
  approve_rate_pct: number;
  decline_rate_pct: number;
}

export interface ScoreDistributionBucket {
  range: string;
  count: number;
}

export interface RiskTierBreakdown {
  tier: string;
  count: number;
  pct: number;
}

export interface RiskTimeseriesPoint {
  bucket: string;
  total_decisions: number;
  approve_rate_pct: number;
  decline_rate_pct: number;
  mean_credit_score: number;
}

export interface RiskResponse {
  period: string;
  generated_at: string;
  approval_rates: {
    overall: RiskOverall;
    by_grade: RiskByGrade[];
  };
  score_distribution: {
    buckets: ScoreDistributionBucket[];
    mean: number;
    median: number;
    std_dev: number;
  };
  risk_tier_breakdown: RiskTierBreakdown[];
  timeseries: RiskTimeseriesPoint[];
  alerts: AlertItem[];
}

// ==================== MONITORING: MODEL OPS ====================

export interface ChampionSummary {
  model_type: string;
  registry_name: string;
  version: string;
  status: string;
  created_at?: string | null;
  promoted_at?: string | null;
  current_metrics: Record<string, number>;
  live_auc?: number | null;
  auc_change_pct?: number | null;
  auc_alert?: boolean | null;
}

export type DriftStatus = "ok" | "alert";

export interface FeatureDrift {
  feature: string;
  psi: number;
  status: DriftStatus | string;
}

export interface ScoreDistributionPsi {
  model_type: string;
  psi: number;
  status: DriftStatus | string;
}

export interface RetrainingEvent {
  training_id: string;
  completed_at: string;
  model_type: string;
  result: string;
  metrics_before?: Record<string, number>;
  metrics_after?: Record<string, number>;
}

export interface ModelOpsResponse {
  period: string;
  generated_at: string;
  champions: ChampionSummary[];
  feature_drift: FeatureDrift[];
  retraining_history: RetrainingEvent[];
  score_distribution_psi: ScoreDistributionPsi[];
  alerts: AlertItem[];
}

// ==================== MONITORING: COMPLIANCE ====================

export interface AgeGroupRate {
  group: string;
  approval_rate_pct: number;
  count: number;
}

export interface ComplianceAuditLog {
  total_decisions_logged: number;
  decisions_with_full_explainability: number;
  coverage_pct: number;
  error_decisions: number;
  avg_data_quality_score: number;
  dqs_p25: number;
}

export interface DataSubjectRequests {
  total: number;
  pending: number;
  completed: number;
  avg_resolution_days: number;
}

export interface ComplianceResponse {
  period: string;
  generated_at: string;
  fairness_metrics: {
    demographic_parity: {
      approval_rate_by_age_group: AgeGroupRate[];
      max_disparity_pct: number;
    };
  };
  audit_log: ComplianceAuditLog;
  data_subject_requests: DataSubjectRequests;
  regulation_alerts: unknown[];
  alerts: AlertItem[];
}

// ==================== MONITORING: ALERTS FEED ====================

export type AlertDashboard =
  | "infrastructure"
  | "risk"
  | "model_ops"
  | "compliance";

export interface AlertDetail {
  id: string;
  metric: string;
  dashboard: AlertDashboard | string;
  severity: AlertSeverity | string;
  status: AlertStatus | string;
  current_value: number;
  threshold: number;
  detail?: string;
  feature?: string | null;
  model_type?: string | null;
  recommended_action?: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface AlertsResponse {
  generated_at: string;
  alerts: AlertDetail[];
  summary: {
    total_firing: number;
    critical_firing: number;
    warning_firing: number;
  };
}

// ==================== PLATFORM API LOGS (admin) ====================

export interface PlatformApiLogActor {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface PlatformApiLogEntry {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseTimeMs: number | null;
  ipAddress: string | null;
  errorMessage: string | null;
  createdAt: string;
  actor: PlatformApiLogActor | null;
}

export interface PlatformApiLogFilters {
  page?: number;
  perPage?: number;
  method?: string;
  statusCode?: number;
  statusClass?: "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
  path?: string;
  fromDate?: string;
  toDate?: string;
}

// ==================== QUERY PARAMS ====================

export type InfrastructurePeriod = "1h" | "6h" | "24h" | "7d" | "30d";
export type RiskPeriod = "24h" | "7d" | "30d" | "90d";
export type ModelOpsPeriod = "7d" | "30d" | "90d";
export type CompliancePeriod = "7d" | "30d" | "90d";

export interface InfrastructureParams {
  period?: InfrastructurePeriod;
  endpoint?: string;
}

export interface RiskParams {
  period?: RiskPeriod;
  segment?: ScoreGrade | string;
}

export interface ModelOpsParams {
  period?: ModelOpsPeriod;
  model_type?: string;
}

export interface ComplianceParams {
  period?: CompliancePeriod;
}

export interface AlertsParams {
  status?: AlertStatus | string;
  severity?: AlertSeverity | string;
  limit?: number;
}
