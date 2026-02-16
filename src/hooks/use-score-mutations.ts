import { useMutation, useQueryClient } from "@tanstack/react-query";
import { scoreService } from "@/lib/score-service";
import { toast } from "sonner";
import { SCORE_KEYS } from "./use-score-queries";

export function useCreateScoreRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: scoreService.createScoreRequest,
    onSuccess: (data) => {
      toast.success("Score Request created successfully");

      // Invalidate list queries to refresh data
      queryClient.invalidateQueries({ queryKey: SCORE_KEYS.lists() });
    },
    onError: (error: any) => {
      // console.error("Create Score Request failed", error);
      // Optional: Global error handling is often done in apiClient interceptor,
      // but component-specific error handling can happen here or in the component
    },
  });
}
