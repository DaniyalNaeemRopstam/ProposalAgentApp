"use client";

import { useQuery } from "@tanstack/react-query";
import { DEMO_SEQUENCES, type FollowUpSequence } from "@proposalagent/shared";
import { useAuth } from "@/context/AuthContext";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";

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
  return useQuery({
    queryKey: ["sequences", isGuest ? "guest" : "auth"],
    queryFn: async (): Promise<FollowUpSequence[]> => {
      if (isGuest) return [...DEMO_SEQUENCES];
      const res = await fetch(apiUrl("/api/sequences"), {
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });

      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Failed to fetch sequences");
      }

      const raw = await res.json();
      const data = parseEnvelope<unknown>(raw);
      return normalizeSequences(data);
    },
    staleTime: 30 * 1000,
  });
}
