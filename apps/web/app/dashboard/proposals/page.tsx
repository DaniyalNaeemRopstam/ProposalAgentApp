import { Suspense, type ReactNode } from "react";
import { ProposalTab } from "@/components/dashboard/ProposalTab";
import { ProposalSkeleton } from "@/components/skeletons/ProposalSkeleton";

function ProposalTabFallback(): ReactNode {
  return (
    <div className="animate-slideUp px-5 py-6">
      <ProposalSkeleton />
    </div>
  );
}

export default function ProposalsPage(): ReactNode {
  return (
    <Suspense fallback={<ProposalTabFallback />}>
      <ProposalTab />
    </Suspense>
  );
}
