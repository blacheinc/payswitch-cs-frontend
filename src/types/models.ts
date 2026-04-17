// Core type definitions for PaySwitch Credit Scoring Platform

// ==================== ENUMS ====================

export type OrganizationStatus = "pending" | "active" | "suspended";
export type IndustryType = "bank" | "fintech" | "mfi" | "sacco" | "other";
export type UserRoleLabel = "admin" | "credit_officer" | "developer" | "viewer";
export type UserStatus = "pending" | "active" | "removed";
export type ApiKeyEnvironment = "sandbox" | "production";
export type ApiKeyStatus = "active" | "revoked";
export type ScoreRequestStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";
export type ScoreRequestSource = "api" | "web_portal" | "bulk";
export type RiskCategory = "very_low" | "low" | "medium" | "high" | "very_high";
export type DataQualityFlag = "sufficient" | "limited" | "thin_file";
export type DecisionType = "approved" | "declined" | "referred" | "pending";
export type ModelStatus =
  | "training"
  | "validation"
  | "staging"
  | "production"
  | "deprecated"
  | "archived";

// ==================== ORGANIZATION ====================

export interface Organization {
  id: string;
  name: string;
  shortName: string;
  industryType: IndustryType;
  address?: string;
  status: OrganizationStatus;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationPayload {
  name: string;
  shortName: string;
  industryType: IndustryType;
  address?: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
}

// ==================== USERS ====================

export interface User {
  id: string;
  email: string;
  name: string;
  roleLabel: UserRoleLabel;
  status: UserStatus;
  organizationId?: string;
  organization?: Organization;
  lastLoginAt?: string;
  createdAt: string;
  /** Resolved RBAC codes from GET /auth/me `permissions` (or refreshed via GET /auth/me/permissions). */
  permissions?: string[];
}

export interface AdminUser extends User {
  isAdmin: true;
  adminRole: "super_admin" | "data_science" | "operations";
}

export interface OrgUser extends User {
  organizationId: string;
  organization: Organization;
}

export interface AuthResponse {
  requires2FA?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  userType?: string;
}

export interface LoginResponse extends AuthResponse {}

// ==================== API KEYS ====================

export interface ApiKey {
  id: string;
  organizationId: string;
  keyPrefix: string;
  name: string;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  lastUsedAt?: string;
  createdById: string;
  createdAt: string;
  revokedAt?: string;
}

export interface CreateApiKeyPayload {
  name: string;
  environment: ApiKeyEnvironment;
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string; // Only returned once on creation
}

// ==================== CREDIT SCORE REQUEST ====================

export interface ApplicantInfo {
  full_name: string;
  date_of_birth: string; // ISO date
  national_id_number?: string | null;
  phone?: string | null;
  account_number?: string | null;
}

export interface LoanRequestInfo {
  amount: number;
  tenure_months: number;
  purpose?: string | null;
}

// ==================== BUREAU TYPES ====================

export interface BureauLookupRequest {
  full_name?: string | null;
  date_of_birth: string; // ISO date, required
  identification?: string | null;
  phone_number?: string | null;
  account_number?: string | null;
  enquiry_reason?: string;
}

export interface BureauPersonalDetails {
  consumer_id?: string | null;
  first_name?: string | null;
  surname?: string | null;
  other_names?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  national_id?: string | null;
  phone?: string | null;
  email?: string | null;
  employer?: string | null;
  address?: string | null;
  marital_status?: string | null;
  dependants?: string | null;
}

export interface BureauCreditSummary {
  total_accounts?: number | null;
  total_monthly_instalment_ghs?: number | null;
  total_outstanding_debt_ghs?: number | null;
  total_accounts_in_arrear?: number | null;
  total_arrear_amount_ghs?: number | null;
  total_accounts_good_standing?: number | null;
  total_judgements?: number | null;
  total_judgement_amount_ghs?: number | null;
  total_dishonoured_cheques?: number | null;
  delinquency_rating?: string | null;
}

export interface BureauCreditAccount {
  subscriber_name?: string | null;
  account_no?: string | null;
  date_opened?: string | null;
  facility_type?: string | null;
  currency?: string | null;
  credit_limit?: number | null;
  current_balance?: number | null;
  instalment_amount?: number | null;
  arrear_amount?: number | null;
  months_in_arrears?: number | null;
  status_code?: string | null;
  payment_history_24m?: string[] | null;
}

/**
 * All 30 DE contract features — aligned with OpenAPI `BureauFeatures`.
 * Most values are string passthrough from XDS (same format for reverse mapping).
 * Account-status flags are booleans from the bureau mapper.
 */
export interface BureauFeatures {
  highest_delinquency_rating?: string | null;
  has_active_arrears?: string | null;
  total_arrear_amount_ghs?: string | null;
  total_outstanding_debt_ghs?: string | null;
  num_active_accounts?: string | null;
  total_monthly_instalment_ghs?: string | null;
  num_accounts_total?: string | null;
  num_bounced_cheques?: string | null;
  mobile_max_loan_ghs?: string | null;
  worst_arrears_24m?: string | null;
  num_dependants?: string | null;
  identity_verified?: string | null;
  has_employer_detail?: string | null;
  applicant_age?: string | null;
  credit_age_months?: string | null;
  months_on_time_24m?: string | null;
  current_streak_on_time?: string | null;
  utilisation_ratio?: string | null;
  num_closed_accounts_good?: string | null;
  product_diversity_score?: string | null;
  mobile_loan_history_count?: string | null;
  has_judgement?: string | null;
  has_written_off?: boolean | null;
  has_charged_off?: boolean | null;
  has_legal_handover?: boolean | null;
  has_adverse_default?: boolean | null;
  num_enquiries_3m?: string | null;
  num_enquiries_12m?: string | null;
  enquiry_reason_flags?: string | null;
  address_stability?: string | null;
}

export interface BureauMetadata {
  credit_score?: number | null;
  score_grade?: string | null; // A-F
  decision_label?: string | null; // APPROVE / CONDITIONAL_APPROVE / REFER / DECLINE
  data_quality_score?: number | null;
  bureau_hit_status?: string;
  product_source?: string | null;
  applicant_age_at_application?: number | null;
  credit_age_months_at_application?: number | null;
}

export interface BureauLookupResponse {
  bureau_hit_status: string; // HIT, NO_RECORD, MULTIPLE_MATCH
  match_count?: number;
  personal_details?: BureauPersonalDetails | null;
  credit_summary?: BureauCreditSummary | null;
  credit_accounts?: BureauCreditAccount[] | null;
  features?: BureauFeatures | null;
  metadata?: BureauMetadata | null;
  enquiry_id?: string | null;
  consumer_id?: string | null;
}

/** Bureau data forwarded into the score request (from the bureau-lookup step). */
export interface BureauData {
  consumer_id: string;
  bureau_hit_status?: string | null;
  product_source?: string | null;
  credit_summary?: BureauCreditSummary | null;
  credit_accounts?: BureauCreditAccount[] | null;
  features?: BureauFeatures | null;
}

export interface RequestMetadata {
  channel?: string | null;
  callback_url?: string | null;
}

/** Payload for POST /v1/score-requests — matches CreateScoreRequestInput in the OpenAPI spec. */
export interface ScoreRequestPayload {
  reference_id?: string | null;
  applicant: ApplicantInfo;
  loan_request: LoanRequestInfo;
  bureau_data: BureauData;
  metadata?: RequestMetadata | null;
}

// ==================== SCORE RESPONSE ====================

export interface ScoreComponent {
  score: number;
  maxScore: number;
  weight: number;
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface RiskFactor {
  code: string;
  category:
    | "payment_history"
    | "credit_utilization"
    | "credit_age"
    | "credit_mix"
    | "new_credit"
    | "income"
    | "debt"
    | "other";
  description: string;
  impact: "positive" | "negative" | "neutral";
  severity: "high" | "medium" | "low";
  detail?: string;
}

export interface Recommendation {
  type: "approve" | "verify" | "condition" | "decline" | "refer";
  message: string;
  priority: "required" | "recommended" | "optional";
}

export interface AffordabilityAssessment {
  estimatedMonthlyPayment?: number;
  debtToIncomeCurrent?: number;
  debtToIncomeProjected?: number;
  disposableIncome?: number;
  affordabilityAssessment?:
    | "comfortable"
    | "manageable"
    | "stretched"
    | "unaffordable";
  maxRecommendedAmount?: number;
}

export interface ScoreResult {
  value: number;
  maxValue: number;
  minValue: number;
  percentile: number;
  riskCategory: RiskCategory;
  riskCategoryDescription: string;
  confidence: number;
  dataQualityFlag: DataQualityFlag;
}

export interface ScoreResponse {
  requestId: string;
  referenceId?: string;
  status: ScoreRequestStatus;
  score?: ScoreResult;
  scoreComponents?: {
    paymentHistory?: ScoreComponent;
    creditUtilization?: ScoreComponent;
    creditHistoryLength?: ScoreComponent;
    creditMix?: ScoreComponent;
    newCredit?: ScoreComponent;
    incomeStability?: ScoreComponent;
    debtBurden?: ScoreComponent;
  };
  riskFactors?: RiskFactor[];
  recommendations?: Recommendation[];
  affordability?: AffordabilityAssessment;
  modelInfo?: {
    modelVersion: string;
    modelType: string;
    featuresUsed: number;
    dataSources: string[];
  };
  timestamps: {
    requestedAt: string;
    scoredAt?: string;
    validUntil?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ==================== SCORE REQUEST RECORD ====================

/**
 * Inline `scoring_result` — **snake_case**, same shape as the API and as
 * `score-requests/[id]/page.tsx` (`sr.scoring_result`, `result?.scoring_metadata?.credit_score`).
 */
export interface ScoreRequestShapContribution {
  feature: string;
  value: number;
  direction: string;
}

export interface ScoreRequestCreditRisk {
  probability_of_default?: number | null;
  pd_confidence?: number | null;
  risk_tier?: string | null;
  shap_contributions?: ScoreRequestShapContribution[] | null;
  decision_reason_codes?: string[] | null;
  model_version?: string | null;
}

export interface ScoreRequestFraudDetection {
  fraud_anomaly_score?: number | null;
  fraud_risk_flag?: string | null;
  model_version?: string | null;
}

export interface ScoreRequestLoanAmountModel {
  recommended_amount_ghs?: number | null;
  recommended_loan_tier?: string | null;
  model_version?: string | null;
}

export interface ScoreRequestIncomeVerification {
  income_tier?: number | null;
  income_tier_label?: string | null;
  income_confidence?: number | null;
  model_version?: string | null;
}

/** `scoring_result.scoring_metadata` — snake_case. */
export interface ScoreRequestScoringMetadata {
  score_grade?: string | null;
  credit_score?: number | null;
  product_source?: string | null;
  bureau_hit_status?: string | null;
  data_quality_score?: number | null;
  applicant_age_at_application?: number | null;
  credit_age_months_at_application?: number | null;
}

export interface ScoreRequestScoringResult {
  request_id?: string | null;
  scoring_timestamp?: string | null;
  decision?: string | null;
  condition_applied?: unknown[] | null;
  decline_reasons?: string[] | null;
  triggered_rules?: unknown[] | null;
  credit_risk?: ScoreRequestCreditRisk | null;
  fraud_detection?: ScoreRequestFraudDetection | null;
  loan_amount?: ScoreRequestLoanAmountModel | null;
  income_verification?: ScoreRequestIncomeVerification | null;
  scoring_metadata?: ScoreRequestScoringMetadata | null;
  errors?: unknown | null;
}

export interface ScoreRequest {
  id: string;
  trackingId: string;
  organizationId: string;
  referenceId?: string;
  status: ScoreRequestStatus;
  requestSource: ScoreRequestSource;
  applicantName: string;
  /** Top-level list field `score_value` (model / internal scale) — not the bureau credit score. */
  scoreValue?: number | null;
  /** Inline scoring payload — snake_case, same as detail page `sr.scoring_result`. */
  scoring_result?: ScoreRequestScoringResult | null;
  riskCategory?: RiskCategory;
  modelVersion?: string;
  processingTimeMs?: number;
  apiKeyId?: string;
  createdByUserId?: string;
  createdAt: string;
  scoredAt?: string;
  validUntil?: string;
  decision?: string;
  loanAmount?: number | null;
  loanPurpose?: string | null;
}

export interface ScoreRequestWithDetails extends ScoreRequest {
  requestPayload?: ScoreRequestPayload;
  scoreResult?: ScoreResponse;
  scoreDecision?: ScoreDecision;
}

// ==================== SCORE DECISION ====================

export interface ScoreDecision {
  id: string;
  scoreRequestId: string;
  decision: DecisionType;
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  decisionNotes?: string;
  decidedByUserId: string;
  decidedAt: string;
}

export interface RecordDecisionPayload {
  decision: DecisionType;
  approvedAmount?: number;
  approvedTenure?: number;
  interestRate?: number;
  decisionNotes?: string;
}

// ==================== MODEL MANAGEMENT ====================

export interface ModelVersion {
  id: string;
  version: string;
  modelType: string;
  status: ModelStatus;
  isChampion: boolean;
  rollbackVersionId?: string;
  metrics: {
    auc?: number;
    ks?: number;
    gini?: number;
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
  featureCount: number;
  trainingDataRef?: string;
  artifactPath?: string;
  promotedAt?: string;
  promotedById?: string;
  createdAt: string;
}

// ==================== AGENTIC AI ====================

export type AgentStatus = "idle" | "running" | "warning" | "error" | "offline";

export interface AIAgent {
  id: string;
  name: string;
  role:
    | "data_quality"
    | "feature_engineering"
    | "risk_scoring"
    | "retraining"
    | "compliance_checker";
  status: AgentStatus;
  lastAction: string;
  lastActionAt: string;
  successRate24h: number;
  autonomousActionsCount: number;
  healthMetrics: {
    cpu: number;
    memory: number;
    latency: number;
  };
}

export interface AgentActionLog {
  id: string;
  agentId: string;
  actionType: string;
  description: string;
  impact: "low" | "medium" | "high";
  status: "success" | "failure" | "in_progress";
  timestamp: string;
}

// ==================== USAGE & ANALYTICS ====================

export interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageScoreToday?: number;
  averageResponseTimeMs?: number;
}

export interface DashboardStats {
  usage: UsageStats;
  scoreDistribution: {
    veryLow: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
  };
  recentRequests: ScoreRequest[];
}

// ==================== PAGINATION ====================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// ==================== API ERROR ====================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

/** Extract a human-readable message from any error thrown by apiClient. */
export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred",
): string {
  // ApiError object rejected by the response interceptor
  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as ApiError).message === "string"
  ) {
    return (error as ApiError).message;
  }
  // Standard Error instance
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
