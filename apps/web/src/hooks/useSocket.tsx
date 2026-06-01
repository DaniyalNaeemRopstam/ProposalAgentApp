"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { getSocketBase } from "@/lib/api";
import { C } from "@/styles/theme";

export type DashboardSocketCallbacks = {
  /** Increment unread-style badge on Jobs in the sidebar (high-fit matches). */
  onSidebarJobsBump?: () => void;
  /** Header “live activity” counter. */
  onLiveActivityBump?: () => void;
  /** Trigger analytics stat-strip animation after stats invalidate. */
  onStatsBump?: () => void;
};

function playNotificationSound(): void {
  if (typeof window === "undefined") return;
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.28;
    void audio.play().catch(() => playSubtleBeep());
  } catch {
    playSubtleBeep();
  }
}

function playSubtleBeep(): void {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.045;
    o.start();
    o.stop(ctx.currentTime + 0.08);
  } catch {
    /* autoplay / audio blocked */
  }
}

/**
 * Connect Socket.IO on dashboard mount using JWT from handshake auth; disconnect on unmount.
 */
export function useSocket(callbacks?: DashboardSocketCallbacks): void {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const base = getSocketBase();
    if (!base) return;

    const token =
      window.localStorage.getItem("pa_token")?.trim() ??
      window.localStorage.getItem("token")?.trim() ??
      window.localStorage.getItem("authToken")?.trim() ??
      "";
    if (!token) return;

    const socket = io(base, {
      transports: ["websocket", "polling"],
      auth: { token },
      withCredentials: true,
    });

    socket.on("connect_error", () => {
      // Avoid noisy toast for socket issues; cron / REST still works.
    });

    socket.on(
      "new-job-match",
      (payload: {
        job?: { title?: unknown; budget?: unknown };
      }) => {
        const title =
          typeof payload.job?.title === "string" && payload.job.title.trim().length > 0
            ? payload.job.title
            : "Opportunity";
        const budget =
          typeof payload.job?.budget === "string" && payload.job.budget.trim().length > 0
            ? payload.job.budget
            : "";

        playNotificationSound();

        toast.custom(
          (t) => (
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                router.push("/dashboard/jobs");
              }}
              className="flex w-[min(100vw-2rem,22rem)] flex-col gap-1 rounded-xl border px-4 py-3 text-left shadow-lg transition hover:opacity-[0.97]"
              style={{
                background: C.surface,
                borderColor: C.accent,
                color: C.text,
                boxShadow: `0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px ${C.accent}33 inset`,
              }}
            >
              <div className="text-[13px] font-semibold leading-snug">
                ⚡ New high-fit job{budget ? ":" : ""} {title}
                {budget ? (
                  <span className="mt-0.5 block font-normal text-textMuted">— {budget}</span>
                ) : null}
              </div>
              <div className="text-[11px] text-textDim">Open Jobs →</div>
            </button>
          ),
          { duration: 6000 }
        );

        void queryClient.invalidateQueries({ queryKey: ["jobs"] });
        cbRef.current?.onSidebarJobsBump?.();
        cbRef.current?.onLiveActivityBump?.();
      }
    );

    socket.on("stats-updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      cbRef.current?.onStatsBump?.();
      cbRef.current?.onLiveActivityBump?.();
    });

    socket.on("sequence-due", (payload: { sequence?: { jobTitle?: unknown } }) => {
      const jobTitle =
        typeof payload.sequence?.jobTitle === "string" && payload.sequence.jobTitle.trim().length > 0
          ? payload.sequence.jobTitle
          : "a job";
      toast(`📨 Follow-up due for ${jobTitle}`);
      void queryClient.invalidateQueries({ queryKey: ["sequences"] });
      cbRef.current?.onLiveActivityBump?.();
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, router]);
}
