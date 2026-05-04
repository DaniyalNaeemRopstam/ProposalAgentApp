import { Suspense, type ReactNode } from "react";
import { ProposalTab } from "@/components/dashboard/ProposalTab";

function ProposalTabFallback(): ReactNode {
  return (
    <div className="animate-slideUp px-5 py-16 text-center">
      <div className="mb-4 animate-pulse text-accent">
        <span className="inline-block">&nbsp;</span>
      </div>
      <p className="animate-pulse text-sm text-textMuted">Opening proposal writer…</p>
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
