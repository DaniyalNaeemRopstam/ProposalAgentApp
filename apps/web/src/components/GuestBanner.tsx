"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useGuestSignUpModal } from "@/components/GuestSignUpModalProvider";
import { Btn } from "@/components/ui/Btn";
import { C } from "@/styles/theme";

const DISMISS_KEY = "pa_guest_banner_dismissed";

export function GuestBanner() {
  const { isGuest, isLoading } = useAuth();
  const { visible: modalOpen } = useGuestSignUpModal();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (isLoading || !isGuest || dismissed || modalOpen) return null;

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-between gap-3 border-b px-4 text-[12px] sm:px-6"
      style={{
        background: "#151D40",
        borderColor: C.accent,
      }}
    >
      <span className="min-w-0 truncate text-textMuted">
        <span className="text-text">⚡ You&apos;re in preview mode</span>
        <span className="hidden sm:inline"> — exploring ProposalAgent</span>
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Link href="/register">
          <Btn className="!px-3 !py-1 !text-[11px]">Create free account</Btn>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-6 w-6 items-center justify-center rounded text-textMuted hover:bg-white/10 hover:text-text"
          aria-label="Dismiss preview banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
