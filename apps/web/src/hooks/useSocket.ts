"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { getApiBase } from "@/lib/api";

export type DashboardSocketCallbacks = {
  /** Increment unread-style badge on Jobs in the sidebar (high-fit matches). */
  onSidebarJobsBump?: () => void;
  /** Header “live activity” counter. */
  onLiveActivityBump?: () => void;
  /** Trigger analytics stat-strip animation after stats invalidate. */
  onStatsBump?: () => void;
};

/**
 * Connect Socket.IO on dashboard mount using JWT from handshake auth; disconnect on unmount.
 */
export function useSocket(callbacks?: DashboardSocketCallbacks): void {
  const queryClient = useQueryClient();
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const base = getApiBase() || window.location.origin;
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

    socket.on("new-job-match", (payload: { job?: { title?: unknown } }) => {
      const title =
        typeof payload.job?.title === "string" && payload.job.title.trim().length > 0
          ? payload.job.title
          : "Opportunity";
      toast(`⚡ New high-fit job: ${title}`);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      cbRef.current?.onSidebarJobsBump?.();
      cbRef.current?.onLiveActivityBump?.();
    });

    socket.on("stats-updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
      cbRef.current?.onStatsBump?.();
      cbRef.current?.onLiveActivityBump?.();
    });

    socket.on("sequence-due", (payload: { sequence?: { jobTitle?: unknown } }) => {
      const jobTitle =
        typeof payload.sequence?.jobTitle === "string" &&
        payload.sequence.jobTitle.trim().length > 0
          ? payload.sequence.jobTitle
          : "a job";
      toast(`📨 Follow-up due for ${jobTitle}`);
      void queryClient.invalidateQueries({ queryKey: ["sequences"] });
      cbRef.current?.onLiveActivityBump?.();
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
}
