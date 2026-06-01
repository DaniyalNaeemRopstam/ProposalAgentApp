import { useQuery } from "@tanstack/react-query";
import {
  guestPipelineGrouped,
  SAMPLE_PIPELINE_TOTAL_VALUE,
} from "@proposalagent/shared";
import { useAuth } from "../context/AuthContext";
import { serverApi } from "../lib/api";

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

export function usePipeline() {
  const { isGuest } = useAuth();
  const q = useQuery({
    queryKey: ["pipeline", isGuest ? "guest" : "auth"],
    queryFn: async (): Promise<{
      grouped: Record<PipelineStageId, PipelineDealRow[]>;
      totalValue: number;
    }> => {
      if (isGuest) {
        return {
          grouped: guestPipelineGrouped() as Record<PipelineStageId, PipelineDealRow[]>,
          totalValue: SAMPLE_PIPELINE_TOTAL_VALUE,
        };
      }
      const data = await serverApi.request<PipelineListPayload>("/api/pipeline");
      const grouped = normalizeGrouped(data.grouped ?? {});
      const totalValue =
        typeof data.totalValue === "number" ? data.totalValue : 0;
      return { grouped, totalValue };
    },
    staleTime: 20 * 1000,
  });
  return { ...q, isDemo: Boolean(isGuest) };
}

export function nextStageFor(stage: PipelineStageId): PipelineStageId | null {
  const i = PIPELINE_STAGE_ORDER.indexOf(stage);
  if (i < 0 || i >= PIPELINE_STAGE_ORDER.length - 1) return null;
  return PIPELINE_STAGE_ORDER[i + 1];
}
