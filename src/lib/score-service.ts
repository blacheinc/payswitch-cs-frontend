import apiClient from "./api-client";
import { API_ENDPOINTS } from "./constant";
import {
  ScoreRequest,
  ScoreRequestPayload,
  ScoreResponse,
  PaginatedResponse,
  PaginationParams,
} from "@/types/models";

// Define strict API response types if different from models
// For now assuming models match API responses for these main entities

export const scoreService = {
  // GET: Fetch all score requests (paginated)
  async getScoreRequests(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<ScoreRequest>> {
    const response = await apiClient.get<PaginatedResponse<ScoreRequest>>(
      API_ENDPOINTS.SCORE_REQUESTS.BASE,
      { params },
    );
    return response.data;
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
