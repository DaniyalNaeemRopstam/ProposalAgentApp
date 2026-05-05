import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: async (): Promise<{
      grouped: Record<PipelineStageId, PipelineDealRow[]>;
      totalValue: number;
    }> => {
      const data = await serverApi.request<PipelineListPayload>("/api/pipeline");
      const grouped = normalizeGrouped(data.grouped ?? {});
      const totalValue =
        typeof data.totalValue === "number" ? data.totalValue : 0;
      return { grouped, totalValue };
    },
    staleTime: 20 * 1000,
  });
}

export function nextStageFor(stage: PipelineStageId): PipelineStageId | null {
  const i = PIPELINE_STAGE_ORDER.indexOf(stage);
  if (i < 0 || i >= PIPELINE_STAGE_ORDER.length - 1) return null;
  return PIPELINE_STAGE_ORDER[i + 1];
}
