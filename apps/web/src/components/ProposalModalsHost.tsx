"use client";

import type { Job } from "@proposalagent/shared";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { SignupPromptModal } from "@/components/modals/SignupPromptModal";
import { useAppStore } from "@/store/appStore";

function jobKey(job: Job | null): string | null {
  if (!job) return null;
  const j = job as Job & { _id?: string; id?: string };
  const raw = j._id ?? j.id;
  return raw != null ? String(raw) : null;
}

/** Mount once under dashboard shell — drives global signup / upgrade modals via Zustand. */
export function ProposalModalsHost(): ReactNode {
  const router = useRouter();
  const queryClient = useQueryClient();
  const showSignupModal = useAppStore((s) => s.showSignupModal);
  const showUpgradeModal = useAppStore((s) => s.showUpgradeModal);
  const setShowSignupModal = useAppStore((s) => s.setShowSignupModal);
  const setShowUpgradeModal = useAppStore((s) => s.setShowUpgradeModal);
  const setPendingJobForProposal = useAppStore((s) => s.setPendingJobForProposal);

  function onSignupSuccess(): void {
    const st = useAppStore.getState();
    const jid = jobKey(st.pendingJobForProposal);
    st.setPendingJobForProposal(null);

    toast.success("Welcome to ProposalAgent! ⚡");

    void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    void queryClient.invalidateQueries({ queryKey: ["sequences"] });
    void queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    void queryClient.invalidateQueries({ queryKey: ["analytics"] });

    window.dispatchEvent(new CustomEvent("pa-registration-success"));

    window.setTimeout(() => {
      st.setShowSignupModal(false);
    }, 280);

    window.setTimeout(() => {
      if (jid) {
        router.push(`/dashboard/proposals?jobId=${encodeURIComponent(jid)}`);
      }
    }, 100);
  }

  return (
    <>
      <SignupPromptModal
        open={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onRegistered={onSignupSuccess}
      />
      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
}
