import { useQuery } from "@tanstack/react-query";
import { SAMPLE_SEQUENCES, type FollowUpSequence } from "@proposalagent/shared";
import { useAuth } from "../context/AuthContext";
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
  const { isGuest } = useAuth();
  const q = useQuery({
    queryKey: ["sequences", isGuest ? "guest" : "auth"],
    queryFn: async (): Promise<FollowUpSequence[]> => {
      if (isGuest) return [...SAMPLE_SEQUENCES];
      const raw = await serverApi.request<unknown>("/api/sequences");
      return normalizeSequences(raw);
    },
    staleTime: 30 * 1000,
  });
  return { ...q, isDemo: Boolean(isGuest) };
}
