import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

/** Opens register screen when guests attempt AI actions. */
export function useGuestAiGate() {
  const { isGuest } = useAuth();
  const router = useRouter();
  const [promptVisible, setPromptVisible] = useState(false);

  const requireAuthForAi = useCallback((): boolean => {
    if (!isGuest) return true;
    setPromptVisible(true);
    router.push("/auth/register");
    return false;
  }, [isGuest, router]);

  return { isGuest, requireAuthForAi, promptVisible, clearPrompt: () => setPromptVisible(false) };
}
