"use client";

import { useQuery } from "@tanstack/react-query";
import {
  demoPipelineGrouped,
  DEMO_PIPELINE_TOTAL_VALUE,
} from "@proposalagent/shared";
import { useAuth } from "@/context/AuthContext";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";

/** Mirrors `server/src/models/PipelineDeal.ts` — keep in sync with API */
export const PIPELINE_STAGE_ORDER = [
  "applied",
  "replied",
  "discovery",
  "proposed",
  "negotiating",
  "won",
  "lost",
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGE_ORDER)[number];

export type PipelineDealRow = {
  _id: string;
  title: string;
  client: string;
  budget: string;
  platform: string;
  stage: PipelineStageId;
  notes?: string;
  nextAction?: string;
  proposalId?: string;
};

export type PipelineListPayload = {
  grouped: Partial<Record<PipelineStageId, PipelineDealRow[]>>;
  all: PipelineDealRow[];
  totalValue: number;
};

function normalizeGrouped(
  grouped: Partial<Record<PipelineStageId, PipelineDealRow[]>>
): Record<PipelineStageId, PipelineDealRow[]> {
  const out = {} as Record<PipelineStageId, PipelineDealRow[]>;
  for (const stage of PIPELINE_STAGE_ORDER) {
    out[stage] = grouped[stage] ?? [];
  }
  return out;
}

async function fetchPipeline(): Promise<{
  grouped: Record<PipelineStageId, PipelineDealRow[]>;
  totalValue: number;
}> {
  const res = await fetch(apiUrl("/api/pipeline"), {
    credentials: "include",
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) {
    await notifyHttpError(res);
    throw new Error("Failed to load pipeline");
  }
  const raw = await res.json();
  const data = parseEnvelope<PipelineListPayload>(raw);
  const grouped = normalizeGrouped(data.grouped ?? {});
  const totalValue = typeof data.totalValue === "number" ? data.totalValue : 0;
  return { grouped, totalValue };
}

export function usePipeline() {
  const { isGuest } = useAuth();
  return useQuery({
    queryKey: ["pipeline", isGuest ? "guest" : "auth"],
    queryFn: () =>
      isGuest
        ? Promise.resolve({
            grouped: demoPipelineGrouped() as Record<PipelineStageId, PipelineDealRow[]>,
            totalValue: DEMO_PIPELINE_TOTAL_VALUE,
          })
        : fetchPipeline(),
    staleTime: 20 * 1000,
  });
}
