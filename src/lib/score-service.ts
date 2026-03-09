import apiClient from "./api-client";
import { API_ENDPOINTS } from "./constant";
import {
  ScoreRequest,
  ScoreRequestPayload,
  ScoreResponse,
} from "@/types/models";
import type { PaginatedResponse, PaginationParams } from "@/types/api-type";

interface ApiPaginatedScoreRequests {
  items: any[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
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
      items: data.items,
      total: data.total,
      page: data.page,
      perPage: data.per_page,
      totalPages: data.total_pages,
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
