import apiClient from "./api-client";
import { API_ENDPOINTS } from "./constant";
import {
  ScoreRequest,
  ScoreRequestPayload,
  ScoreResponse,
} from "@/types/models";
import type { PaginatedResponse, PaginationParams } from "@/types/api-type";

interface ApiScoreRequest {
  request_id: string;
  tracking_id: string;
  organization_id: string;
  reference_id?: string | null;
  status: any;
  request_source: any;
  applicant_name?: string; // Might not be in all summaries but handled if present
  score_value?: number | null;
  risk_category?: any;
  model_version?: string;
  processing_time_ms?: number;
  api_key_id?: string;
  created_by_user_id?: string;
  created_at: string;
  scored_at?: string | null;
  valid_until?: string | null;
}

interface ApiPaginatedScoreRequests {
  items: ApiScoreRequest[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

function mapScoreRequest(raw: ApiScoreRequest): ScoreRequest {
  return {
    id: raw.request_id || (raw as any).id,
    trackingId: raw.tracking_id,
    organizationId: raw.organization_id,
    referenceId: raw.reference_id || undefined,
    status: raw.status,
    requestSource: raw.request_source,
    applicantName: raw.applicant_name || "Unknown",
    scoreValue: raw.score_value || undefined,
    riskCategory: raw.risk_category || undefined,
    modelVersion: raw.model_version,
    processingTimeMs: raw.processing_time_ms,
    apiKeyId: raw.api_key_id,
    createdByUserId: raw.created_by_user_id,
    createdAt: raw.created_at,
    scoredAt: raw.scored_at || undefined,
    validUntil: raw.valid_until || undefined,
  };
}

// Query key factory for React Query cache management
export const SCORE_KEYS = {
  all: ["score-requests"] as const,
  lists: () => [...SCORE_KEYS.all, "list"] as const,
  list: (params: PaginationParams) => [...SCORE_KEYS.lists(), params] as const,
  details: () => [...SCORE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SCORE_KEYS.details(), id] as const,
};

export const scoreService = {
  // GET: Fetch all score requests (paginated)
  async getScoreRequests(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ScoreRequest>> {
    const response = await apiClient.get<ApiPaginatedScoreRequests>(
      API_ENDPOINTS.SCORE_REQUESTS.BASE,
      { params },
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

  // GET: Fetch a single score request by ID
  async getScoreRequestById(id: string): Promise<ScoreResponse> {
    const response = await apiClient.get<ScoreResponse>(
      API_ENDPOINTS.SCORE_REQUESTS.BY_ID(id),
    );
    return response.data;
  },

  // POST: Create a new score request
  async createScoreRequest(
    payload: ScoreRequestPayload,
  ): Promise<ScoreResponse> {
    const response = await apiClient.post<ScoreResponse>(
      API_ENDPOINTS.SCORE_REQUESTS.BASE,
      payload,
    );
    return response.data;
  },

  // GET: Fetch outcome (might be same as details, but specific endpoint exists)
  async getScoreRequestOutcome(id: string): Promise<ScoreResponse> {
    const response = await apiClient.get<ScoreResponse>(
      API_ENDPOINTS.SCORE_REQUESTS.OUTCOME(id),
    );
    return response.data;
  },
};
