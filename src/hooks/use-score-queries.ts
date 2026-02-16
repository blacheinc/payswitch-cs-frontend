import { useQuery } from "@tanstack/react-query";
import { scoreService } from "@/lib/score-service";
import { PaginationParams } from "@/types/models";

// Define query keys for caching
export const SCORE_KEYS = {
  all: ["score-requests"] as const,
  lists: () => [...SCORE_KEYS.all, "list"] as const,
  list: (params: PaginationParams) => [...SCORE_KEYS.lists(), params] as const,
  details: () => [...SCORE_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SCORE_KEYS.details(), id] as const,
};

export function useScoreRequestsQuery(params?: PaginationParams) {
  return useQuery({
    queryKey: SCORE_KEYS.list(params || {}),
    queryFn: () => scoreService.getScoreRequests(params),
    // Optional: Keep previous data while fetching new page for smoother UI
    placeholderData: (previousData) => previousData,
  });
}

export function useScoreRequestQuery(id: string) {
  return useQuery({
    queryKey: SCORE_KEYS.detail(id),
    queryFn: () => scoreService.getScoreRequestById(id),
    enabled: !!id, // Only fetch if ID is present
  });
}

export function useScoreRequestOutcomeQuery(id: string) {
  return useQuery({
    queryKey: [...SCORE_KEYS.detail(id), "outcome"],
    queryFn: () => scoreService.getScoreRequestOutcome(id),
    enabled: !!id,
  });
}
