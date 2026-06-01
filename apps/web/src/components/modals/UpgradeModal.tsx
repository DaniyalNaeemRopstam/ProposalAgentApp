"use client";

import toast from "react-hot-toast";
import { Btn } from "@/components/ui/Btn";
import { useCreateCheckout } from "@/hooks/useBilling";
import { FREE_PROPOSAL_LIMIT } from "@/lib/proposalLimits";
import { C } from "@/styles/theme";

export type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const checkout = useCreateCheckout();

  if (!open) return null;

  const used = FREE_PROPOSAL_LIMIT;

  async function goSolo() {
    try {
      const url = await checkout.mutateAsync("solo");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout.");
    }
  }

  async function goPro() {
    try {
      const url = await checkout.mutateAsync("pro");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start checkout.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[250] overflow-y-auto bg-black/70 px-3 py-10 backdrop-blur-md sm:px-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="relative mx-auto my-6 max-w-3xl rounded-2xl border p-6 shadow-2xl sm:p-10"
        style={{
          borderColor: C.borderBright,
          background: "#0E1119",
          boxShadow: `0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px ${C.accent}33`,
        }}
        role="dialog"
        aria-modal
        aria-labelledby="upgrade-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="upgrade-modal-title" className="text-center font-display text-xl font-bold text-text">
          You&apos;ve used your 3 free proposals 🎉
        </h2>
        <p className="mt-2 text-center text-sm text-textMuted">
          You&apos;re clearly serious about winning clients. Upgrade to keep going.
        </p>

        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-1 flex justify-between text-xs text-textMuted">
            <span>Usage</span>
            <span>{used}/{FREE_PROPOSAL_LIMIT} proposals used</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full w-full rounded-full bg-accent" />
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Free</div>
            <div className="mt-1 font-display text-lg text-text">FREE</div>
            <ul className="mt-3 space-y-1.5 text-xs text-textMuted">
              <li>3 proposals total ✗ (used up)</li>
              <li>Upwork only</li>
              <li>No follow-ups</li>
              <li>No analytics</li>
            </ul>
          </div>

          <div
            className="relative rounded-xl border p-4"
            style={{
              borderColor: C.accent,
              background: `${C.accent}0d`,
              boxShadow: `0 0 32px ${C.accent}22`,
            }}
          >
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              ★ Most popular
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-accentText">Solo</div>
            <div className="mt-1 font-display text-lg text-text">$49/mo</div>
            <ul className="mt-3 space-y-1.5 text-xs text-text">
              <li>Unlimited proposals</li>
              <li>All platforms (Upwork, LinkedIn, Wellfound, HN)</li>
              <li>Automatic follow-up sequences</li>
              <li>Win analytics + AI coaching</li>
              <li>Voice profile training</li>
            </ul>
            <Btn
              type="button"
              variant="primary"
              className="mt-4 w-full justify-center"
              disabled={checkout.isPending}
              onClick={() => void goSolo()}
            >
              {checkout.isPending ? "Redirecting…" : "Upgrade to Solo — $49/mo"}
            </Btn>
          </div>

          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-textMuted">Pro</div>
            <div className="mt-1 font-display text-lg text-text">$149/mo</div>
            <ul className="mt-3 space-y-1.5 text-xs text-textMuted">
              <li>Everything in Solo</li>
              <li>3 team seats</li>
              <li>Contract generator</li>
              <li>Cold email mode</li>
            </ul>
            <Btn
              type="button"
              variant="ghost"
              className="mt-4 w-full justify-center border border-border"
              disabled={checkout.isPending}
              onClick={() => void goPro()}
            >
              Upgrade to Pro
            </Btn>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-textDim">
          🔒 Secure payment via Stripe · Cancel anytime · No hidden fees
        </p>

        <div className="mt-6 flex justify-center">
          <Btn type="button" variant="ghost" onClick={onClose}>
            Maybe later
          </Btn>
        </div>
      </div>
    </div>
  );
}
