import toast from "react-hot-toast";
import { C, CX } from "@/styles/theme";

let upgradeModalHandler: (() => void) | null = null;

export function registerUpgradeModalHandler(fn: (() => void) | null): void {
  upgradeModalHandler = fn;
}

export function openUpgradeModalFromApiError(): void {
  upgradeModalHandler?.();
}

const toastDark = {
  background: C.surface,
  color: C.text,
  border: `1px solid ${C.border}`,
};

export async function extractApiMessage(res: Response): Promise<string | undefined> {
  try {
    const clone = res.clone();
    const json = (await clone.json()) as unknown;
    if (
      json &&
      typeof json === "object" &&
      "message" in json &&
      typeof (json as { message: unknown }).message === "string"
    ) {
      return (json as { message: string }).message;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Map HTTP status → default user-facing copy (falls back to server message when helpful). */
export function messageForHttpStatus(status: number, serverMessage?: string): string {
  const hint = serverMessage?.trim();

  switch (status) {
    case 401:
      return "Session expired — please log in again";
    case 403:
      return hint && /proposal|quota|plan|upgrade/i.test(hint)
        ? hint
        : "Upgrade your plan to use this feature";
    case 429:
      return "Slow down — too many requests. Wait a moment.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong on our end. Try again.";
    default:
      return hint ?? "Something went wrong";
  }
}

/**
 * Shows toast (+ 401 redirect / 403 upgrade modal) for a failed API response.
 * Does not consume the body for callers that still need to read JSON.
 */
export async function notifyHttpError(res: Response): Promise<void> {
  const serverMsg = await extractApiMessage(res);
  const msg = messageForHttpStatus(res.status, serverMsg);

  if (res.status === 401) {
    toast.error(msg, { duration: 4000, style: toastDark });
    if (typeof window !== "undefined") {
      const hadSession =
        !!(
          localStorage.getItem("pa_token")?.trim() ||
          localStorage.getItem("token")?.trim() ||
          localStorage.getItem("authToken")?.trim()
        );
      try {
        localStorage.removeItem("pa_token");
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
      } catch {
        //
      }
      // Guests browse /dashboard without a token — API 401s must not send them to login.
      if (
        hadSession &&
        (window.location.pathname.startsWith("/dashboard") ||
          window.location.pathname.startsWith("/onboarding"))
      ) {
        window.location.assign("/login?expired=1");
      }
    }
    return;
  }

  if (res.status === 403) {
    let code: unknown;
    try {
      const cloned = res.clone();
      const raw = (await cloned.json()) as unknown;
      if (
        raw &&
        typeof raw === "object" &&
        "code" in raw &&
        (raw as { code: unknown }).code === "PROPOSAL_LIMIT_REACHED"
      ) {
        code = "PROPOSAL_LIMIT_REACHED";
      }
    } catch {
      /* ignore malformed JSON */
    }

    if (code === "PROPOSAL_LIMIT_REACHED") {
      const { useAppStore } = await import("@/store/appStore");
      useAppStore.getState().setShowUpgradeModal(true);
      return;
    }

    openUpgradeModalFromApiError();
    toast(msg, {
      icon: "⚠️",
      duration: 5000,
      style: {
        ...toastDark,
        borderColor: C.warn,
        color: CX.warnText,
      },
    });
    return;
  }

  if (res.status === 429) {
    toast(msg, {
      icon: "⏳",
      duration: 4500,
      style: {
        ...toastDark,
        borderColor: C.warn,
        color: CX.warnText,
      },
    });
    return;
  }

  toast.error(msg, { duration: 5000, style: toastDark });
}

export function notifyNetworkError(): void {
  toast.error("Check your internet connection", { duration: 5000, style: toastDark });
}
