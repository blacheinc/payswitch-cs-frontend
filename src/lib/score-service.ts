import apiClient from "./api-client";
import { API_ENDPOINTS, TABLE_ITEM_PER_PAGE } from "@/lib/constant";
import type { PaginatedResponse, PaginationParams } from "@/types/api-type";
import type {
  BureauFeatures,
  ScoreRequest,
  ScoreRequestScoringResult,
  ScoreRequestStatus,
  ScoreRequestSource,
  RiskCategory,
} from "@/types/models";

// ===================== RAW API SHAPES (snake_case) =====================

interface ApiRawScoreRequest {
  request_id: string;
  tracking_id: string;
  organization_id: string;
  reference_id?: string | null;
  status: string;
  request_source: string;
  applicant_name?: string;
  score_value?: number | null;
  risk_category?: string;
  model_version?: string;
  processing_time_ms?: number;
  api_key_id?: string;
  created_by_user_id?: string;
  created_at: string;
  scored_at?: string | null;
  valid_until?: string | null;
  scoring_result?: ScoreRequestScoringResult | null;
  loan_amount?: number | null;
  loan_purpose?: string | null;
}

interface ApiPaginatedScoreRequests {
  items: ApiRawScoreRequest[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiRawBureauLookupResponse {
  bureau_hit_status: string;
  match_count?: number;
  personal_details?: {
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
  } | null;
  credit_summary?: {
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
  } | null;
  credit_accounts?:
    | {
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
      }[]
    | null;
  features?: BureauFeatures | null;
  metadata?: {
    credit_score?: number | null;
    score_grade?: string | null;
    decision_label?: string | null;
    data_quality_score?: number | null;
    bureau_hit_status?: string;
    product_source?: string | null;
    applicant_age_at_application?: number | null;
    credit_age_months_at_application?: number | null;
  } | null;
  enquiry_id?: string | null;
  consumer_id?: string | null;
}

// ===================== PUBLIC RESPONSE TYPES (camelCase) =====================

/** List row — same shape as `ScoreRequest` in `@/types/models`. */
export type ScoreRequestItem = ScoreRequest;

export interface BureauPersonalDetails {
  consumerId?: string | null;
  firstName?: string | null;
  surname?: string | null;
  otherNames?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  nationalId?: string | null;
  phone?: string | null;
  email?: string | null;
  employer?: string | null;
  address?: string | null;
  maritalStatus?: string | null;
  dependants?: string | null;
}

export interface BureauCreditSummary {
  totalAccounts?: number | null;
  totalMonthlyInstalmentGhs?: number | null;
  totalOutstandingDebtGhs?: number | null;
  totalAccountsInArrear?: number | null;
  totalArrearAmountGhs?: number | null;
  totalAccountsGoodStanding?: number | null;
  totalJudgements?: number | null;
  totalJudgementAmountGhs?: number | null;
  totalDishonouredCheques?: number | null;
  delinquencyRating?: string | null;
}

export interface BureauCreditAccount {
  subscriberName?: string | null;
  accountNo?: string | null;
  dateOpened?: string | null;
  facilityType?: string | null;
  currency?: string | null;
  creditLimit?: number | null;
  currentBalance?: number | null;
  instalmentAmount?: number | null;
  arrearAmount?: number | null;
  monthsInArrears?: number | null;
  statusCode?: string | null;
  paymentHistory24m?: string[] | null;
}

export interface BureauMetadata {
  creditScore?: number | null;
  scoreGrade?: string | null;
  decisionLabel?: string | null;
  dataQualityScore?: number | null;
  bureauHitStatus?: string;
  productSource?: string | null;
  applicantAgeAtApplication?: number | null;
  creditAgeMonthsAtApplication?: number | null;
}

export interface BureauLookupResult {
  bureauHitStatus: string;
  matchCount?: number;
  personalDetails?: BureauPersonalDetails | null;
  creditSummary?: BureauCreditSummary | null;
  creditAccounts?: BureauCreditAccount[] | null;
  features?: BureauFeatures | null;
  metadata?: BureauMetadata | null;
  enquiryId?: string | null;
  consumerId?: string | null;
}

/** Request payload for bureau lookup — sent as snake_case. */
export interface BureauLookupPayload {
  fullName?: string;
  dateOfBirth: string;
  identification?: string;
  phoneNumber?: string;
  accountNumber?: string;
  enquiryReason?: string;
}

/** Payload for score request creation — service maps to snake_case before sending. */
export interface CreateScoreRequestPayload {
  referenceId?: string;
  applicant: {
    fullName: string;
    dateOfBirth: string;
    nationalIdNumber?: string;
    phone?: string;
    accountNumber?: string;
  };
  loanRequest: {
    amount: number;
    tenureMonths: number;
    purpose?: string;
  };
  /** Raw bureau data to forward — already in API shape from the lookup. */
  bureauData: {
    consumerId: string;
    bureauHitStatus?: string;
    productSource?: string | null;
    creditSummary?: ApiRawBureauLookupResponse["credit_summary"];
    creditAccounts?: ApiRawBureauLookupResponse["credit_accounts"];
    features?: Partial<BureauFeatures> | null;
  };
  channel?: string;
}

/** Override a REFER decision — POST /v1/score-requests/{id}/override */
export interface OverrideDecisionPayload {
  decision: "APPROVE" | "CONDITIONAL_APPROVE" | "DECLINE";
  overrideReason: string;
  conditions?: string[] | null;
  approvedAmount?: number | null;
  approvedTenureMonths?: number | null;
}

/** Record lending outcome — POST /v1/score-requests/{id}/outcome */
export interface RecordOutcomePayload {
  decision: string; // approved | declined | referred
  approvedAmount?: number | null;
  approvedTenureMonths?: number | null;
  interestRate?: number | null;
  declineReason?: string | null;
  decisionNotes?: string | null;
  decisionDate?: string | null;
}

/** Record loan performance — POST /v1/score-requests/{id}/performance */
export interface RecordPerformancePayload {
  status: string; // current | past_due_30 | past_due_60 | past_due_90 | default | paid_off | write_off
  daysPastDue?: number | null;
  outstandingBalance?: number | null;
  asOfDate: string; // yyyy-MM-dd
}

// ===================== MAPPERS =====================

function mapScoreRequest(raw: ApiRawScoreRequest): ScoreRequestItem {
  return {
    id: raw.request_id || raw.tracking_id,
    trackingId: raw.tracking_id,
    organizationId: raw.organization_id,
    referenceId: raw.reference_id || undefined,
    status: raw.status as ScoreRequestStatus,
    requestSource: raw.request_source as ScoreRequestSource,
    applicantName: raw.applicant_name || "Unknown",
    scoreValue: raw.score_value ?? null,
    scoring_result: raw.scoring_result ?? null,
    riskCategory: (raw.risk_category as RiskCategory) || undefined,
    modelVersion: raw.model_version,
    processingTimeMs: raw.processing_time_ms,
    apiKeyId: raw.api_key_id,
    createdByUserId: raw.created_by_user_id,
    createdAt: raw.created_at,
    scoredAt: raw.scored_at || undefined,
    validUntil: raw.valid_until || undefined,
    decision: raw.scoring_result?.decision || undefined,
    loanAmount: raw.loan_amount ?? null,
    loanPurpose: raw.loan_purpose ?? null,
  };
}

function mapBureauPersonalDetails(
  raw: NonNullable<ApiRawBureauLookupResponse["personal_details"]>,
): BureauPersonalDetails {
  return {
    consumerId: raw.consumer_id,
    firstName: raw.first_name,
    surname: raw.surname,
    otherNames: raw.other_names,
    birthDate: raw.birth_date,
    gender: raw.gender,
    nationalId: raw.national_id,
    phone: raw.phone,
    email: raw.email,
    employer: raw.employer,
    address: raw.address,
    maritalStatus: raw.marital_status,
    dependants: raw.dependants,
  };
}

function mapCreditSummary(
  raw: NonNullable<ApiRawBureauLookupResponse["credit_summary"]>,
): BureauCreditSummary {
  return {
    totalAccounts: raw.total_accounts,
    totalMonthlyInstalmentGhs: raw.total_monthly_instalment_ghs,
    totalOutstandingDebtGhs: raw.total_outstanding_debt_ghs,
    totalAccountsInArrear: raw.total_accounts_in_arrear,
    totalArrearAmountGhs: raw.total_arrear_amount_ghs,
    totalAccountsGoodStanding: raw.total_accounts_good_standing,
    totalJudgements: raw.total_judgements,
    totalJudgementAmountGhs: raw.total_judgement_amount_ghs,
    totalDishonouredCheques: raw.total_dishonoured_cheques,
    delinquencyRating: raw.delinquency_rating,
  };
}

function mapCreditAccount(
  raw: NonNullable<ApiRawBureauLookupResponse["credit_accounts"]>[number],
): BureauCreditAccount {
  return {
    subscriberName: raw.subscriber_name,
    accountNo: raw.account_no,
    dateOpened: raw.date_opened,
    facilityType: raw.facility_type,
    currency: raw.currency,
    creditLimit: raw.credit_limit,
    currentBalance: raw.current_balance,
    instalmentAmount: raw.instalment_amount,
    arrearAmount: raw.arrear_amount,
    monthsInArrears: raw.months_in_arrears,
    statusCode: raw.status_code,
    paymentHistory24m: raw.payment_history_24m,
  };
}

function mapBureauMetadata(
  raw: NonNullable<ApiRawBureauLookupResponse["metadata"]>,
): BureauMetadata {
  return {
    creditScore: raw.credit_score,
    scoreGrade: raw.score_grade,
    decisionLabel: raw.decision_label,
    dataQualityScore: raw.data_quality_score,
    bureauHitStatus: raw.bureau_hit_status,
    productSource: raw.product_source,
    applicantAgeAtApplication: raw.applicant_age_at_application,
    creditAgeMonthsAtApplication: raw.credit_age_months_at_application,
  };
}

function mapBureauLookup(raw: ApiRawBureauLookupResponse): BureauLookupResult {
  return {
    bureauHitStatus: raw.bureau_hit_status,
    matchCount: raw.match_count,
    personalDetails: raw.personal_details
      ? mapBureauPersonalDetails(raw.personal_details)
      : null,
    creditSummary: raw.credit_summary
      ? mapCreditSummary(raw.credit_summary)
      : null,
    creditAccounts: raw.credit_accounts
      ? raw.credit_accounts.map(mapCreditAccount)
      : null,
    features: raw.features,
    metadata: raw.metadata ? mapBureauMetadata(raw.metadata) : null,
    enquiryId: raw.enquiry_id,
    consumerId: raw.consumer_id,
  };
}

// ===================== SCORE REQUESTS STATS =====================

export type ScoreDashboardPeriod = "today" | "7d" | "30d" | "90d";

export type ScoreDecision =
  | "APPROVE"
  | "CONDITIONAL_APPROVE"
  | "DECLINE"
  | "REFER"
  | "FRAUD_HOLD"
  | "ERROR";

export interface ScoreDistributionBucket {
  range: "300-499" | "500-579" | "580-669" | "670-739" | "740-850";
  count: number;
}

export interface StatsDecisionCounts {
  APPROVE: number;
  CONDITIONAL_APPROVE: number;
  DECLINE: number;
  REFER: number;
  ERROR: number;
  FRAUD_HOLD: number;
}

export interface StatsCurrent {
  total_requests: number;
  decided: number;
  avg_credit_score: number | null;
  median_credit_score: number | null;
  approval_rate_pct: number;
  decision_counts: StatsDecisionCounts;
  score_distribution: ScoreDistributionBucket[];
}

export interface StatsPrevious {
  total_requests: number;
  decided: number;
  avg_credit_score: number | null;
  approval_rate_pct: number;
}

export interface StatsTrend {
  total_delta_pct: number | null;
  approval_delta_pp: number | null;
  score_delta: number | null;
}

export interface StatsNeedsAttention {
  referred: number;
  pending_or_processing: number;
  failed: number;
}

export interface ScoreRequestStatsResponse {
  period: ScoreDashboardPeriod;
  generated_at: string;
  current: StatsCurrent;
  previous: StatsPrevious;
  trend: StatsTrend;
  needs_attention: StatsNeedsAttention;
}

// ===================== BATCH SCORING TYPES =====================

export type BatchJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type BatchItemStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface BatchItemPayload {
  fullName?: string;
  dateOfBirth: string;
  identification?: string;
  phoneNumber?: string;
  accountNumber?: string;
  enquiryReason?: string;
}

export interface SubmitBatchPayload {
  items: BatchItemPayload[];
}

export interface SubmitBatchResponse {
  jobId: string;
  status: BatchJobStatus;
  total: number;
  requestedAt: string;
}

export interface BatchItemCounts {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export interface BatchJobStatusResponse {
  jobId: string;
  status: BatchJobStatus;
  total: number;
  progressPct: number;
  items: BatchItemCounts;
  requestedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BatchJobListItem {
  jobId: string;
  status: BatchJobStatus;
  total: number;
  completed: number;
  failed: number;
  requestedAt: string;
  completedAt?: string | null;
}

export interface BatchJobsListResponse {
  items: BatchJobListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BatchResultItem {
  index: number;
  status: BatchItemStatus;
  scoreRequestId?: string | null;
  scoreTrackingId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  payload: Record<string, unknown>;
  completedAt?: string | null;
}

export interface BatchResultsResponse {
  jobId: string;
  items: BatchResultItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CancelBatchResponse {
  jobId: string;
  status: BatchJobStatus;
  cancelledItems: number;
}

export interface BatchJobsListParams {
  status?: BatchJobStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface BatchResultsParams {
  status?: BatchItemStatus | "all";
  page?: number;
  pageSize?: number;
}

// ===================== BATCH MAPPERS =====================

interface ApiBatchSubmitResponse {
  job_id: string;
  status: string;
  total: number;
  requested_at: string;
}

interface ApiBatchStatus {
  job_id: string;
  status: string;
  total: number;
  progress_pct: number;
  items: BatchItemCounts;
  requested_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

interface ApiBatchJobListItem {
  job_id: string;
  status: string;
  total: number;
  completed: number;
  failed: number;
  requested_at: string;
  completed_at?: string | null;
}

interface ApiBatchJobsList {
  items: ApiBatchJobListItem[];
  total: number;
  page: number;
  page_size: number;
}

interface ApiBatchResultItem {
  index: number;
  status: string;
  score_request_id?: string | null;
  score_tracking_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  payload: Record<string, unknown>;
  completed_at?: string | null;
}

interface ApiBatchResults {
  job_id: string;
  items: ApiBatchResultItem[];
  total: number;
  page: number;
  page_size: number;
}

interface ApiBatchCancel {
  job_id: string;
  status: string;
  cancelled_items: number;
}

function mapBatchJobListItem(raw: ApiBatchJobListItem): BatchJobListItem {
  return {
    jobId: raw.job_id,
    status: raw.status as BatchJobStatus,
    total: raw.total,
    completed: raw.completed,
    failed: raw.failed,
    requestedAt: raw.requested_at,
    completedAt: raw.completed_at ?? null,
  };
}

function mapBatchResultItem(raw: ApiBatchResultItem): BatchResultItem {
  return {
    index: raw.index,
    status: raw.status as BatchItemStatus,
    scoreRequestId: raw.score_request_id ?? null,
    scoreTrackingId: raw.score_tracking_id ?? null,
    errorCode: raw.error_code ?? null,
    errorMessage: raw.error_message ?? null,
    payload: raw.payload ?? {},
    completedAt: raw.completed_at ?? null,
  };
}

// ===================== QUERY KEYS =====================

export const SCORE_KEYS = {
  all: ["score-requests"] as const,
  lists: () => [...SCORE_KEYS.all, "list"] as const,
  list: (params: PaginationParams) => [...SCORE_KEYS.lists(), params] as const,
  details: () => [...SCORE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SCORE_KEYS.details(), id] as const,
  scoringResult: (id: string) =>
    [...SCORE_KEYS.all, "scoring-result", id] as const,
  stats: (period: ScoreDashboardPeriod) =>
    [...SCORE_KEYS.all, "stats", period] as const,
};

export const BATCH_KEYS = {
  all: ["batch-scoring"] as const,
  lists: () => [...BATCH_KEYS.all, "list"] as const,
  list: (params: BatchJobsListParams) =>
    [...BATCH_KEYS.lists(), params] as const,
  details: () => [...BATCH_KEYS.all, "detail"] as const,
  detail: (jobId: string) => [...BATCH_KEYS.details(), jobId] as const,
  results: (jobId: string, params: BatchResultsParams) =>
    [...BATCH_KEYS.all, "results", jobId, params] as const,
};

export const BUREAU_KEYS = {
  all: ["bureau"] as const,
  lookup: (params?: Record<string, unknown>) =>
    [...BUREAU_KEYS.all, "lookup", params] as const,
};

// ===================== SERVICE =====================

export const scoreService = {
  /** GET /v1/score-requests — paginated list */
  async getScoreRequests(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ScoreRequestItem>> {
    const decision = Array.isArray(params?.decision)
      ? params.decision.length
        ? params.decision.join(",")
        : undefined
      : params?.decision || undefined;
    const response = await apiClient.get<ApiPaginatedScoreRequests>(
      API_ENDPOINTS.SCORE_REQUESTS.BASE,
      {
        params: {
          page: params?.page,
          per_page: params?.perPage || TABLE_ITEM_PER_PAGE,
          search: params?.search || undefined,
          status: params?.status || undefined,
          decision,
        },
      },
    );
    const data = response.data;
    return {
      items: data?.items?.map(mapScoreRequest) || [],
      total: data?.total,
      page: data?.page,
      perPage: data?.per_page,
      totalPages: data?.total_pages,
    };
  },

  /** GET /v1/score-requests/stats — aggregated KPIs for the org dashboard. */
  async getScoreRequestsStats(
    period: ScoreDashboardPeriod,
  ): Promise<ScoreRequestStatsResponse> {
    const response = await apiClient.get<ScoreRequestStatsResponse>(
      API_ENDPOINTS.SCORE_REQUESTS.STATS,
      { params: { period } },
    );
    return response.data;
  },

  /** GET /v1/score-requests/{id} — full detail */
  async getScoreRequestById(id: string) {
    const response = await apiClient.get(
      API_ENDPOINTS.SCORE_REQUESTS.BY_ID(id),
    );
    // Returns raw ScoreRequestResponse shape — consumed directly by the detail page
    return response.data;
  },

  /** POST /v1/bureau-lookup — Step 1 of the scoring flow */
  async bureauLookup(
    payload: BureauLookupPayload,
  ): Promise<BureauLookupResult> {
    const response = await apiClient.post<ApiRawBureauLookupResponse>(
      API_ENDPOINTS.BUREAU.LOOKUP,
      {
        full_name: payload.fullName || undefined,
        date_of_birth: payload.dateOfBirth,
        identification: payload.identification || undefined,
        phone_number: payload.phoneNumber || undefined,
        account_number: payload.accountNumber || undefined,
        enquiry_reason:
          payload.enquiryReason || "Application for credit by a borrower",
      },
    );
    return mapBureauLookup(response.data);
  },

  /** POST /v1/score-requests — Step 2: create score request */
  async createScoreRequest(payload: CreateScoreRequestPayload) {
    const response = await apiClient.post(
      API_ENDPOINTS.SCORE_REQUESTS.BASE,
      {
        reference_id: payload.referenceId || undefined,
        applicant: {
          full_name: payload.applicant.fullName,
          date_of_birth: payload.applicant.dateOfBirth,
          national_id_number: payload.applicant.nationalIdNumber || undefined,
          phone: payload.applicant.phone || undefined,
          account_number: payload.applicant.accountNumber || undefined,
        },
        loan_request: {
          amount: payload.loanRequest.amount,
          tenure_months: payload.loanRequest.tenureMonths,
          purpose: payload.loanRequest.purpose || undefined,
        },
        bureau_data: {
          consumer_id: payload.bureauData.consumerId,
          bureau_hit_status: payload.bureauData.bureauHitStatus || undefined,
          product_source: payload.bureauData.productSource || undefined,
          credit_summary: payload.bureauData.creditSummary || undefined,
          credit_accounts: payload.bureauData.creditAccounts || undefined,
          features: payload.bureauData.features || undefined,
        },
        metadata: payload.channel
          ? { channel: payload.channel }
          : undefined,
      },
    );
    return response.data;
  },

  /** GET /v1/score-requests/{id}/scoring-result */
  async getScoringResult(id: string) {
    const response = await apiClient.get(
      API_ENDPOINTS.SCORE_REQUESTS.SCORING_RESULT(id),
    );
    return response.data;
  },

  /** POST /v1/score-requests/{id}/override */
  async overrideDecision(id: string, payload: OverrideDecisionPayload) {
    const response = await apiClient.post(
      API_ENDPOINTS.SCORE_REQUESTS.OVERRIDE(id),
      {
        decision: payload.decision,
        override_reason: payload.overrideReason,
        conditions: payload.conditions || undefined,
        approved_amount: payload.approvedAmount || undefined,
        approved_tenure_months: payload.approvedTenureMonths || undefined,
      },
    );
    return response.data;
  },

  /** POST /v1/score-requests/{id}/outcome */
  async recordOutcome(id: string, payload: RecordOutcomePayload) {
    const response = await apiClient.post(
      API_ENDPOINTS.SCORE_REQUESTS.OUTCOME(id),
      {
        decision: payload.decision,
        approved_amount: payload.approvedAmount || undefined,
        approved_tenure_months: payload.approvedTenureMonths || undefined,
        interest_rate: payload.interestRate || undefined,
        decline_reason: payload.declineReason || undefined,
        decision_notes: payload.decisionNotes || undefined,
        decision_date: payload.decisionDate || undefined,
      },
    );
    return response.data;
  },

  // ===================== BATCH SCORING =====================

  /** POST /v1/score/batch — submit a batch of applicants */
  async submitBatch(
    payload: SubmitBatchPayload,
  ): Promise<SubmitBatchResponse> {
    const response = await apiClient.post<ApiBatchSubmitResponse>(
      API_ENDPOINTS.BATCH_SCORING.BASE,
      {
        items: payload.items.map((item) => ({
          full_name: item.fullName || undefined,
          date_of_birth: item.dateOfBirth,
          identification: item.identification || undefined,
          phone_number: item.phoneNumber || undefined,
          account_number: item.accountNumber || undefined,
          enquiry_reason: item.enquiryReason || undefined,
        })),
      },
    );
    const data = response.data;
    return {
      jobId: data.job_id,
      status: data.status as BatchJobStatus,
      total: data.total,
      requestedAt: data.requested_at,
    };
  },

  /** GET /v1/score/batch — list org's batch jobs */
  async listBatchJobs(
    params?: BatchJobsListParams,
  ): Promise<BatchJobsListResponse> {
    const response = await apiClient.get<ApiBatchJobsList>(
      API_ENDPOINTS.BATCH_SCORING.BASE,
      {
        params: {
          status:
            params?.status && params.status !== "all"
              ? params.status
              : undefined,
          page: params?.page,
          page_size: params?.pageSize,
        },
      },
    );
    const data = response.data;
    return {
      items: data?.items?.map(mapBatchJobListItem) ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      pageSize: data?.page_size ?? 20,
    };
  },

  /** GET /v1/score/batch/{job_id} — job progress + counts */
  async getBatchJobStatus(jobId: string): Promise<BatchJobStatusResponse> {
    const response = await apiClient.get<ApiBatchStatus>(
      API_ENDPOINTS.BATCH_SCORING.BY_ID(jobId),
    );
    const data = response.data;
    return {
      jobId: data.job_id,
      status: data.status as BatchJobStatus,
      total: data.total,
      progressPct: data.progress_pct,
      items: data.items,
      requestedAt: data.requested_at,
      startedAt: data.started_at ?? null,
      completedAt: data.completed_at ?? null,
    };
  },

  /** GET /v1/score/batch/{job_id}/results — per-item results */
  async getBatchResults(
    jobId: string,
    params?: BatchResultsParams,
  ): Promise<BatchResultsResponse> {
    const response = await apiClient.get<ApiBatchResults>(
      API_ENDPOINTS.BATCH_SCORING.RESULTS(jobId),
      {
        params: {
          status:
            params?.status && params.status !== "all"
              ? params.status
              : undefined,
          page: params?.page,
          page_size: params?.pageSize,
        },
      },
    );
    const data = response.data;
    return {
      jobId: data.job_id,
      items: data?.items?.map(mapBatchResultItem) ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? 1,
      pageSize: data?.page_size ?? 50,
    };
  },

  /** POST /v1/score/batch/{job_id}/cancel — cancel queued/processing job */
  async cancelBatchJob(jobId: string): Promise<CancelBatchResponse> {
    const response = await apiClient.post<ApiBatchCancel>(
      API_ENDPOINTS.BATCH_SCORING.CANCEL(jobId),
    );
    const data = response.data;
    return {
      jobId: data.job_id,
      status: data.status as BatchJobStatus,
      cancelledItems: data.cancelled_items,
    };
  },

  /** POST /v1/score-requests/{id}/performance */
  async recordPerformance(id: string, payload: RecordPerformancePayload) {
    const response = await apiClient.post(
      API_ENDPOINTS.SCORE_REQUESTS.PERFORMANCE(id),
      {
        status: payload.status,
        days_past_due: payload.daysPastDue ?? undefined,
        outstanding_balance: payload.outstandingBalance ?? undefined,
        as_of_date: payload.asOfDate,
      },
    );
    return response.data;
  },
};
