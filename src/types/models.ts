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

export interface BureauFeatures {
  highest_delinquency_rating?: number | null;
  months_on_time_24m?: number | null;
  worst_arrears_24m?: number | null;
  current_streak_on_time?: number | null;
  has_active_arrears?: number | null;
  total_arrear_amount_ghs?: number | null;
  total_outstanding_debt_ghs?: number | null;
  utilisation_ratio?: number | null;
  num_active_accounts?: number | null;
  total_monthly_instalment_ghs?: number | null;
  credit_age_months?: number | null;
  num_accounts_total?: number | null;
  num_closed_accounts_good?: number | null;
  product_diversity_score?: number | null;
  mobile_loan_history_count?: number | null;
  mobile_max_loan_ghs?: number | null;
  has_judgement?: number | null;
  has_written_off?: number | null;
  has_charged_off?: number | null;
  has_legal_handover?: number | null;
  num_bounced_cheques?: number | null;
  has_adverse_default?: number | null;
  num_enquiries_3m?: number | null;
  num_enquiries_12m?: number | null;
  enquiry_reason_flags?: number | null;
  applicant_age?: number | null;
  identity_verified?: number | null;
  num_dependants?: number | null;
  has_employer_detail?: number | null;
  address_stability?: number | null;
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

export interface ScoreRequest {
  id: string;
  trackingId: string;
  organizationId: string;
  referenceId?: string;
  status: ScoreRequestStatus;
  requestSource: ScoreRequestSource;
  applicantName: string;
  scoreValue?: number;
  riskCategory?: RiskCategory;
  modelVersion?: string;
  processingTimeMs?: number;
  apiKeyId?: string;
  createdByUserId?: string;
  createdAt: string;
  scoredAt?: string;
  validUntil?: string;
}

export interface ScoreRequestWithDetails extends ScoreRequest {
  requestPayload?: ScoreRequestPayload;
  scoreResult?: ScoreResponse;
  decision?: ScoreDecision;
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
