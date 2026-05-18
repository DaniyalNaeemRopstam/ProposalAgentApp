"use client";

import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGuestSignUpModal } from "@/components/GuestSignUpModalProvider";

/** Blocks AI actions for guests and opens the sign-up modal. */
export function useGuestAiGate() {
  const { isGuest } = useAuth();
  const { open } = useGuestSignUpModal();

  const requireAuthForAi = useCallback((): boolean => {
    if (!isGuest) return true;
    open();
    return false;
  }, [isGuest, open]);

  return { isGuest, requireAuthForAi };
}
