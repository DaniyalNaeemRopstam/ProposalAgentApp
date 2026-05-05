import { serverApi } from "./api";

export async function requestMarkProposalSent(proposalId: string): Promise<void> {
  await serverApi.request<unknown>(
    `/api/proposals/${encodeURIComponent(proposalId)}/mark-sent`,
    { method: "POST" }
  );
}
