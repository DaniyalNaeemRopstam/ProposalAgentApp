"use client";

import Link from "next/link";
import { Btn } from "@/components/ui/Btn";
import { C } from "@/styles/theme";
import { useAppStore } from "@/store/appStore";

export const GUEST_STICKY_CTA_DISMISS_KEY = "pa_guest_sticky_cta_dismissed";

type StickyGuestCTAProps = {
  /** False after local dismiss or signup (parent hides). */
  visible: boolean;
  onDismiss: () => void;
};

/** Desktop-only fixed promo bar for guests (hidden on mobile / after dismiss / after signup). */
export function StickyGuestCTA({ visible, onDismiss }: StickyGuestCTAProps) {
  const setShowSignupModal = useAppStore((s) => s.setShowSignupModal);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[95] hidden h-[52px] items-center justify-between gap-4 border-t px-4 sm:px-6 lg:flex"
      style={{
        background: C.accentDim,
        borderTopColor: C.accent,
      }}
      role="region"
      aria-label="Create account"
    >
      <p className="min-w-0 truncate text-[13px] text-text">
        <span className="font-medium text-text">⚡ ProposalAgent</span>
        <span className="text-textMuted"> — AI client acquisition for developers</span>
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-md text-textDim hover:bg-white/10 hover:text-text"
          aria-label="Dismiss"
        >
          ×
        </button>
        <Link
          href="/login"
          className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-textMuted transition-colors hover:border-borderBright hover:text-text"
        >
          Log in
        </Link>
        <Btn
          type="button"
          className="!py-1.5 !text-[12px]"
          onClick={() => setShowSignupModal(true)}
        >
          Create free account
        </Btn>
      </div>
    </div>
  );
}
