import { useQuery } from "@tanstack/react-query";
import type { FollowUpSequence } from "@proposalagent/shared";
import { serverApi } from "../lib/api";

function normalizeSequences(payload: unknown): FollowUpSequence[] {
  if (Array.isArray(payload)) return payload as FollowUpSequence[];
  if (
    payload &&
    typeof payload === "object" &&
    "sequences" in payload &&
    Array.isArray((payload as { sequences: unknown }).sequences)
  ) {
    return (payload as { sequences: FollowUpSequence[] }).sequences;
  }
  return [];
}

export function useSequences() {
  return useQuery({
    queryKey: ["sequences"],
    queryFn: async (): Promise<FollowUpSequence[]> => {
      const raw = await serverApi.request<unknown>("/api/sequences");
      return normalizeSequences(raw);
    },
    staleTime: 30 * 1000,
  });
}
