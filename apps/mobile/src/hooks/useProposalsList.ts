import { useQuery } from "@tanstack/react-query";
import type { Proposal } from "@proposalagent/shared";
import { serverApi } from "../lib/api";

export type ProposalListPayload = {
  proposals: Proposal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export function useProposalsList() {
  return useQuery({
    queryKey: ["proposals", "list"],
    queryFn: () =>
      serverApi.request<ProposalListPayload>(
        "/api/proposals?page=1&limit=50"
      ),
    staleTime: 30 * 1000,
  });
}
