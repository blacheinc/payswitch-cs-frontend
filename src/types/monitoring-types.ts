// Types for Model Management, Rules Engine, and Monitoring dashboards.
// Aligned with OpenAPI spec endpoints.

// ==================== MODEL ====================

export interface ChampionModelsResponse {
  updated_at: string;
  models: ChampionModelEntry[];
}

export interface ChampionModelEntry {
  model_type: string;
  registry_name: string;
  version: string;
  status: string;
  created_at: string;
  metrics: Record<string, number>;
  tags: Record<string, string>;
}

// ==================== RULES ====================

export interface RuleEvaluateRequest {
  probability_of_default: number;
  score_grade: string;
  data_engineer_decision_label?: string | null;
  fraud_risk_flag?: string | null;
  recommended_loan_amount_ghs?: number | null;
  features?: Record<string, number | null> | null;
  metadata?: RuleEvaluateMetadata | null;
}

export interface RuleEvaluateMetadata {
  credit_score?: number | null;
  applicant_age_at_application?: number | null;
  [key: string]: unknown;
}

export interface RuleEvaluateResponse {
  decision: string;
  triggered_rules: TriggeredRule[];
  conditions_applied?: string[];
  decline_reasons?: string[];
  [key: string]: unknown;
}

export interface TriggeredRule {
  rule_id?: string;
  rule_name?: string;
  result?: string;
  details?: string;
  [key: string]: unknown;
}

// ==================== MONITORING: SHARED ====================

export interface TimeseriesPoint {
  timestamp: string;
  value: number;
  [key: string]: unknown;
}

// ==================== MONITORING: INFRASTRUCTURE ====================

export interface InfrastructureDashboard {
  period?: string;
  summary?: Partial<InfraSummary>;
  latency_timeseries?: TimeseriesPoint[];
  error_rate_timeseries?: TimeseriesPoint[];
  request_volume_timeseries?: TimeseriesPoint[];
  endpoints?: EndpointMetrics[];
  [key: string]: unknown;
}

export interface InfraSummary {
  total_requests: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate: number;
  uptime_percent: number;
}

export interface EndpointMetrics {
  path: string;
  method: string;
  total_requests: number;
  avg_latency_ms: number;
  error_rate: number;
  [key: string]: unknown;
}

// ==================== MONITORING: RISK ====================

export interface RiskDashboard {
  period?: string;
  summary?: Partial<RiskSummary>;
  score_distribution?: ScoreDistributionBucket[];
  approval_rate_timeseries?: TimeseriesPoint[];
  delinquency_timeseries?: TimeseriesPoint[];
  [key: string]: unknown;
}

export interface RiskSummary {
  total_scored: number;
  approval_rate: number;
  avg_credit_score: number;
  default_rate: number;
  avg_pd: number;
}

export interface ScoreDistributionBucket {
  grade: string;
  count: number;
  percentage: number;
  [key: string]: unknown;
}

// ==================== MONITORING: MODEL OPS ====================

export interface ModelOpsDashboard {
  period?: string;
  model_type?: string;
  champion?: Partial<ChampionModelSummary>;
  drift_metrics?: DriftMetric[];
  retraining_history?: RetrainingEvent[];
  performance_timeseries?: TimeseriesPoint[];
  [key: string]: unknown;
}

export interface ChampionModelSummary {
  model_version: string;
  model_type: string;
  auc: number;
  ks: number;
  gini: number;
  promoted_at: string;
  predictions_count: number;
}

export interface DriftMetric {
  feature: string;
  drift_score: number;
  status: "ok" | "warning" | "critical";
  [key: string]: unknown;
}

export interface RetrainingEvent {
  id: string;
  triggered_at: string;
  completed_at?: string;
  status: string;
  trigger_reason: string;
  new_model_version?: string;
  [key: string]: unknown;
}

// ==================== MONITORING: COMPLIANCE ====================

export interface ComplianceDashboard {
  period?: string;
  summary?: Partial<ComplianceSummary>;
  fairness_metrics?: FairnessMetric[];
  data_quality_timeseries?: TimeseriesPoint[];
  [key: string]: unknown;
}

export interface ComplianceSummary {
  audit_log_count: number;
  fairness_score: number;
  data_quality_avg: number;
  pii_incidents: number;
}

export interface FairnessMetric {
  attribute: string;
  disparate_impact: number;
  status: "pass" | "warning" | "fail";
  [key: string]: unknown;
}

// ==================== MONITORING: ALERTS ====================

export interface AlertItem {
  id: string;
  /** OpenAPI: warning | critical */
  severity: string;
  /** OpenAPI: firing | resolved | ok */
  status: string;
  title: string;
  message: string;
  source: string;
  fired_at: string;
  resolved_at?: string | null;
  [key: string]: unknown;
}

export type AlertsResponse = AlertItem[];

// ==================== QUERY PARAMS ====================

export interface MonitoringPeriodParams {
  period?: string;
}

export interface InfrastructureParams extends MonitoringPeriodParams {
  endpoint?: string;
}

export interface RiskParams extends MonitoringPeriodParams {
  segment?: string;
}

export interface ModelOpsParams extends MonitoringPeriodParams {
  model_type?: string;
}

export interface AlertsParams {
  status?: string;
  severity?: string;
  limit?: number;
}
