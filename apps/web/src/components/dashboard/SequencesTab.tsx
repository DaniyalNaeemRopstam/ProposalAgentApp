"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSequences } from "@/hooks/useSequences";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { SequenceSkeleton } from "@/components/skeletons/SequenceSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/appStore";
import { C } from "@/styles/theme";
import { apiUrl, authHeaders } from "@/lib/api";
import type { FollowUpSequence } from "@proposalagent/shared";
import toast from "react-hot-toast";
import { cn } from "@/lib/cn";

function getStatusColor(sequence: FollowUpSequence): string {
  if (sequence.status === "stopped") return "success";
  
  // Check next pending message to determine status color
  const pending = sequence.messages?.find((m) => m.status === "pending");
  if (!pending) return "success"; // All sent/skipped
  
  // Status based on next action timing
  const now = new Date();
  const scheduled = new Date(pending.scheduledAt);
  const hoursUntil = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntil <= 0) return "accent"; // Due now
  if (hoursUntil <= 48) return "warn"; // Due soon
  return "accent"; // Future
}

function getStatusText(sequence: FollowUpSequence): string {
  if (sequence.status === "stopped") return "Sequence stopped";
  if (sequence.status === "replied") return "Client replied";
  
  const pending = sequence.messages?.find((m) => m.status === "pending");
  if (!pending) return "All messages sent";
  
  return sequence.viewed ? "Proposal viewed" : "Awaiting reply";
}

function getNextText(sequence: FollowUpSequence): string {
  if (sequence.status === "stopped") return "No further follow-ups";
  if (sequence.status === "replied") return "Call scheduled — no follow-up needed";
  
  const pending = sequence.messages?.find((m) => m.status === "pending");
  if (!pending) return "Sequence complete";
  
  const now = new Date();
  const scheduled = new Date(pending.scheduledAt);
  const diffMs = scheduled.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return "Ready to send now";
  if (diffDays === 1) return "Day " + pending.day + " follow-up tomorrow";
  return `Day ${pending.day} follow-up in ${diffDays} days`;
}

function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays >= 1) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  if (diffHours >= 1) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  return "Just now";
}

const followupTone: Record<string, string> = {
  warn: "bg-warn/20 text-warn",
  accent: "bg-accent/20 text-accentText", 
  success: "bg-success/20 text-success",
};

export function SequencesTab() {
  const queryClient = useQueryClient();
  const { isGuest } = useAuth();
  const openSignup = () => useAppStore.getState().setShowSignupModal(true);
  const { data: sequences = [], isLoading, error } = useSequences();
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const sendNowMutation = useMutation({
    mutationFn: async (sequenceId: string) => {
      const res = await fetch(apiUrl(`/api/sequences/${sequenceId}/send-now`), {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) {
        const json = await res.json();
        const msg =
          json &&
          typeof json === "object" &&
          "message" in json &&
          typeof (json as { message: unknown }).message === "string"
            ? (json as { message: string }).message
            : "Failed to send message";
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
    onError: (error, sequenceId) => {
      setActionErrors((prev) => ({
        ...prev,
        [sequenceId]: error instanceof Error ? error.message : "Failed to send message",
      }));
      setTimeout(() => {
        setActionErrors((prev) => {
          const { [sequenceId]: _, ...rest } = prev;
          return rest;
        });
      }, 5000);
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (sequenceId: string) => {
      const res = await fetch(apiUrl(`/api/sequences/${sequenceId}/stop`), {
        method: "PUT",
        credentials: "include",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) {
        const json = await res.json();
        const msg =
          json &&
          typeof json === "object" &&
          "message" in json &&
          typeof (json as { message: unknown }).message === "string"
            ? (json as { message: string }).message
            : "Failed to stop sequence";
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
    },
    onError: (error, sequenceId) => {
      setActionErrors((prev) => ({
        ...prev,
        [sequenceId]: error instanceof Error ? error.message : "Failed to stop sequence",
      }));
      setTimeout(() => {
        setActionErrors((prev) => {
          const { [sequenceId]: _, ...rest } = prev;
          return rest;
        });
      }, 5000);
    },
  });

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-dangerDim/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <Icon name="target" size={24} />
        </div>
        <p className="text-danger">Failed to load sequences. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-slideUp">
        <p className="mb-4 text-[13px] text-textMuted">Loading follow-up sequences…</p>
        <SequenceSkeleton />
      </div>
    );
  }

  if (sequences.length === 0) {
    return (
      <div className="animate-slideUp rounded-xl border border-border bg-surface p-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surfaceHover">
          <Icon name="clock" size={32} />
        </div>
        <div className="mb-2 font-display text-xl text-text">No active sequences</div>
        <p className="mx-auto max-w-xs text-textMuted">
          Follow-up sequences will appear here when you mark proposals as sent.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      {isGuest ? (
        <div
          className="mb-4 rounded-xl border px-4 py-3 text-[13px] text-textMuted"
          style={{ borderColor: C.accent, background: C.accentDim }}
        >
          Sign up to see your real follow-up sequences
        </div>
      ) : null}
      <p className="mb-4 text-[13px] text-textMuted">
        Automated follow-up sequences for{" "}
        <span className="text-accent">{sequences.length} active proposal{sequences.length === 1 ? "" : "s"}</span>
      </p>
      {sequences.map((sequence) => {
        const statusColor = getStatusColor(sequence);
        const statusText = getStatusText(sequence);
        const nextText = getNextText(sequence);
        const error = actionErrors[sequence._id];
        const sentAt = sequence.createdAt ? getRelativeTime(sequence.createdAt) : "Unknown";
        
        const canSendNow = sequence.status === "active" && 
                          sequence.messages?.some((m) => m.status === "pending");
        const canStop = sequence.status === "active";

        return (
          <div key={sequence._id} className="mb-2.5 rounded-xl border border-border bg-surface px-5 py-4">
            {error && (
              <div className="mb-2 rounded bg-danger/10 px-2 py-1 text-xs text-danger">
                {error}
              </div>
            )}
            <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2">
              <div className="font-display text-sm font-semibold text-text">
                {sequence.jobTitle || "Unknown job"}
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                  followupTone[statusColor]
                )}
              >
                {statusText}
              </span>
            </div>
            <div className="mb-3 flex flex-wrap gap-5 text-xs text-textMuted">
              <span>Sent: {sentAt}</span>
              <span
                className={cn(
                  statusColor === "warn" && "text-warn",
                  statusColor === "accent" && "text-accentText", 
                  statusColor === "success" && "text-success"
                )}
              >
                Next: {nextText}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  if (isGuest) {
                    openSignup();
                    return;
                  }
                  toast("Full preview is available in your workspace.");
                }}
              >
                <Icon name="mail" size={12} /> Preview follow-up
              </Btn>
              {canSendNow && (
                <Btn
                  variant="ghost"
                  className="text-xs"
                  disabled={sendNowMutation.isPending}
                  onClick={() => {
                    if (isGuest) {
                      openSignup();
                      return;
                    }
                    sendNowMutation.mutate(sequence._id);
                  }}
                >
                  <Icon name="send" size={12} />
                  {sendNowMutation.isPending ? "Sending..." : "Send now"}
                </Btn>
              )}
              {canStop && (
                <Btn
                  variant="ghost"
                  className="text-xs"
                  disabled={stopMutation.isPending}
                  onClick={() => {
                    if (isGuest) {
                      openSignup();
                      return;
                    }
                    stopMutation.mutate(sequence._id);
                  }}
                >
                  <Icon name="target" size={12} />
                  {stopMutation.isPending ? "Stopping..." : "Stop"}
                </Btn>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}