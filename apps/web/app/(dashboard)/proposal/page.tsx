import { redirect } from "next/navigation";

/**
 * Legacy route: `/proposal?jobId=` → `/proposals?jobId=`
 */
export default function ProposalRedirectPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): never {
  const raw = searchParams.jobId;
  const jobId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;
  const qs = jobId ? `?jobId=${encodeURIComponent(jobId)}` : "";
  redirect(`/proposals${qs}`);
}
