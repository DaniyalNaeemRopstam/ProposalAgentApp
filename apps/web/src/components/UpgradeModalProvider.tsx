"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Btn } from "@/components/ui/Btn";
import { C } from "@/styles/theme";

type Ctx = { open: () => void; close: () => void };

const UpgradeModalContext = createContext<Ctx | null>(null);

export function useUpgradeModal(): Ctx {
  const v = useContext(UpgradeModalContext);
  if (!v) throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  return v;
}

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      {visible ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-xl border p-6 shadow-xl"
            style={{
              borderColor: C.borderBright,
              background: C.surface,
              boxShadow: `0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px ${C.accent}33`,
            }}
            role="dialog"
            aria-modal
            aria-labelledby="upgrade-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="upgrade-modal-title" className="font-display text-lg font-semibold text-text">
              Unlock this feature
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-textMuted">
              Upgrade your plan to use this feature — get unlimited proposals, all platforms,
              sequences, and analytics.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Btn variant="ghost" type="button" onClick={close}>
                Not now
              </Btn>
              <Link
                href="/dashboard/settings?tab=billing"
                className="inline-flex items-center justify-center rounded-lg border-0 bg-accent px-4 py-2 text-[13px] font-medium text-white transition-all hover:-translate-y-px hover:bg-[#6B8FFF]"
                onClick={close}
              >
                View billing &amp; plans
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </UpgradeModalContext.Provider>
  );
}
