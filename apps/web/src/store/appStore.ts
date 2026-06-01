import type { Job } from "@proposalagent/shared";
import { create } from "zustand";

/** Global UI gates for proposals paywall surfaces (opened from Jobs, Proposal Writer, HTTP 403 hooks). */
type AppUiState = {
  showSignupModal: boolean;
  showUpgradeModal: boolean;
  pendingJobForProposal: Job | null;
  setShowSignupModal: (val: boolean) => void;
  setShowUpgradeModal: (val: boolean) => void;
  setPendingJobForProposal: (job: Job | null) => void;
};

export const useAppStore = create<AppUiState>((set) => ({
  showSignupModal: false,
  showUpgradeModal: false,
  pendingJobForProposal: null,
  setShowSignupModal: (showSignupModal) => set({ showSignupModal }),
  setShowUpgradeModal: (showUpgradeModal) => set({ showUpgradeModal }),
  setPendingJobForProposal: (pendingJobForProposal) => set({ pendingJobForProposal }),
}));
