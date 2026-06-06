import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAnalysis,
  deleteAnalysis,
  getAnalysis,
  updateAnalysisAccess,
} from "@/api/analyses";
import type { CreateAnalysisInput } from "@/types";

export function useAnalysis(id: string | undefined) {
  return useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysis(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAnalysisInput) => createAnalysis(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useUpdateAnalysisAccess(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (team_ids: string[]) => updateAnalysisAccess(id, team_ids),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["analysis", id] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useDeleteAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnalysis(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
