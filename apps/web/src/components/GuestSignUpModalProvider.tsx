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

type Ctx = {
  open: () => void;
  close: () => void;
  visible: boolean;
};

const GuestSignUpModalContext = createContext<Ctx | null>(null);

export function useGuestSignUpModal(): Ctx {
  const v = useContext(GuestSignUpModalContext);
  if (!v) {
    throw new Error("useGuestSignUpModal must be used within GuestSignUpModalProvider");
  }
  return v;
}

export function GuestSignUpModalProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  const value = useMemo(
    () => ({ open, close, visible }),
    [open, close, visible]
  );

  return (
    <GuestSignUpModalContext.Provider value={value}>
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
            aria-labelledby="guest-signup-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div id="guest-signup-modal-title" className="font-display text-lg font-semibold text-text">
              Create a free account to use AI
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-textMuted">
              You can browse jobs, pipeline, sequences, and analytics in preview mode. Sign up free
              to generate proposals with AI in your voice.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Btn variant="ghost" type="button" onClick={close}>
                Keep exploring
              </Btn>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border-0 bg-accent px-4 py-2 text-[13px] font-medium text-white transition-all hover:-translate-y-px hover:bg-[#6B8FFF]"
                onClick={close}
              >
                Sign up free
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </GuestSignUpModalContext.Provider>
  );
}
