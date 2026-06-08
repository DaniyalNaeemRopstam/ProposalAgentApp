"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Btn } from "@/components/ui/Btn";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Icon } from "@/components/dashboard/Icon";
import { cn } from "@/lib/cn";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import toast from "react-hot-toast";
import { notifyHttpError, notifyNetworkError } from "@/lib/apiErrors";
import { useAuth } from "@/context/AuthContext";
import { findDemoJobById } from "@proposalagent/shared";
import { FREE_PROPOSAL_LIMIT } from "@/lib/proposalLimits";
import { useAppStore } from "@/store/appStore";

/** Lean job payload from GET /api/jobs/:id */
type ApiJobRecord = Record<string, unknown> & {
  _id?: string;
  score?: number;
  title?: string;
  budget?: string;
  platform?: string;
  snippet?: string;
  fullDescription?: string;
  tags?: string[];
  sourceUrl?: string;
  url?: string;
  client?: Record<string, unknown>;
};

function getJobSourceUrl(job: ApiJobRecord): string | null {
  const raw =
    (typeof job.sourceUrl === "string" ? job.sourceUrl : "") ||
    (typeof job.url === "string" ? job.url : "");
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapPlatformToMode(platform: string): "upwork" | "linkedin" | "email" {
  const p = platform.trim().toLowerCase();
  if (p.includes("upwork")) return "upwork";
  if (p.includes("linkedin")) return "linkedin";
  return "email";
}

function normalizeJobId(id: unknown): string {
  if (id == null) return "";
  if (typeof id === "string") return id;
  if (
    typeof id === "object" &&
    "toString" in id &&
    typeof (id as { toString(): unknown }).toString === "function"
  ) {
    return String((id as { toString(): string }).toString());
  }
  return "";
}

function jobScore(job: ApiJobRecord): number {
  return typeof job.score === "number" && !Number.isNaN(job.score) ? Math.round(job.score) : 85;
}

function buildJobDescription(job: ApiJobRecord): string {
  const full = typeof job.fullDescription === "string" ? job.fullDescription.trim() : "";
  const snap = typeof job.snippet === "string" ? job.snippet.trim() : "";
  const raw = full || snap || "Job description unavailable.";
  if (raw.length >= 10) return raw;
  return `${raw} ${"—".repeat(10)}`.slice(0, 500);
}

function buildGenerateBody(job: ApiJobRecord, jobIdMongo: string) {
  const client = (job.client ?? {}) as Record<string, unknown>;
  const tags = Array.isArray(job.tags) ? job.tags.map(String) : [];
  const platform =
    typeof job.platform === "string" && job.platform.trim().length ? job.platform : "Custom";

  return {
    jobId: jobIdMongo,
    jobTitle: typeof job.title === "string" ? job.title : "Untitled opportunity",
    jobDescription: buildJobDescription(job),
    jobBudget:
      typeof job.budget === "string" && job.budget.trim().length ? job.budget : "TBD",
    platform,
    clientName:
      typeof client.name === "string" && client.name.trim().length ? client.name : "Client",
    clientCountry:
      typeof client.country === "string" && client.country.trim().length
        ? client.country
        : "Remote",
    tags,
    mode: mapPlatformToMode(platform),
    variant: "quality" as const,
  };
}

export function ProposalTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { isGuest, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const jobIdFromQuery = searchParams.get("jobId");

  const [job, setJob] = useState<ApiJobRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);
  const [proposalMongoId, setProposalMongoId] = useState<string | null>(null);
  const [replyProbability, setReplyProbability] = useState(68);
  const proposalRef = useRef<HTMLTextAreaElement>(null);
  /** Wall-clock anchor for first ~2s “loading checklist” before streaming textarea. */
  const [genStartedAt, setGenStartedAt] = useState<number | null>(null);
  const [genTick, setGenTick] = useState(0);

  /** POST /generate before streaming completes */
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [markSentLoading, setMarkSentLoading] = useState(false);
  const [markSentError, setMarkSentError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchJob(): Promise<void> {
      setLoadError(null);
      setGenerateError(null);
      setProposal("");
      setProposalMongoId(null);
      setReplyProbability(68);
      setCopied(false);

      if (!jobIdFromQuery?.trim()) {
        setJob(null);
        return;
      }

      setJob(null);

      if (isGuest) {
        const demo = findDemoJobById(jobIdFromQuery.trim());
        if (!cancelled) {
          if (demo) setJob(demo as unknown as ApiJobRecord);
          else setLoadError("Demo job not found.");
        }
        return;
      }

      try {
        const res = await fetch(apiUrl(`/api/jobs/${jobIdFromQuery.trim()}`), {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
        if (!res.ok) {
          await notifyHttpError(res);
          const jsonFail = (await res.json()) as unknown;
          const msg =
            jsonFail &&
            typeof jsonFail === "object" &&
            jsonFail !== null &&
            "message" in jsonFail &&
            typeof (jsonFail as { message: unknown }).message === "string"
              ? (jsonFail as { message: string }).message
              : "Unable to load job.";
          throw new Error(msg);
        }
        const json = (await res.json()) as unknown;
        const data = parseEnvelope<ApiJobRecord>(json);
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) {
          if (
            e instanceof TypeError ||
            (e instanceof Error && e.message.toLowerCase().includes("fetch"))
          ) {
            notifyNetworkError();
          }
          setLoadError(e instanceof Error ? e.message : "Failed to load job.");
          setJob(null);
        }
      }
    }

    void fetchJob();
    return () => {
      cancelled = true;
    };
  }, [jobIdFromQuery, isGuest]);

  const mongoJobId = useMemo(
    () => (job ? normalizeJobId(job._id) : jobIdFromQuery?.trim() ?? ""),
    [job, jobIdFromQuery]
  );

  const handleGenerateInternal = useCallback(
    async (sourceJob: ApiJobRecord) => {
      const jid = normalizeJobId(sourceJob._id) || mongoJobId;
      if (!jid) {
        setGenerateError("Missing job reference.");
        return;
      }

      setGenerateError(null);
      setMarkSentError(null);
      setCopied(false);

      try {
        setGenerating(true);
        setGenStartedAt(Date.now());
        setProposal("");
        setProposalMongoId(null);
        const body = buildGenerateBody(sourceJob, jid);
        const res = await fetch(apiUrl("/api/proposals/generate"), {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "text/event-stream",
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          await notifyHttpError(res);
          const raw = await res.text();
          let msg = "Proposal generation failed.";
          try {
            const json = JSON.parse(raw) as { message?: string };
            if (typeof json.message === "string" && json.message.trim()) msg = json.message;
          } catch {
            if (raw.trim()) msg = raw.trim();
          }
          throw new Error(msg);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("Streaming response is not available in this environment.");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        const flushSseBlocks = (raw: string): string => {
          const chunks = raw.split("\n\n");
          const incomplete = chunks.pop() ?? "";
          for (const block of chunks) {
            const line = block.trim();
            if (!line.startsWith("data:")) continue;
            let ev: Record<string, unknown>;
            try {
              ev = JSON.parse(line.slice(5).trim()) as Record<string, unknown>;
            } catch {
              continue;
            }

            const piece = ev.chunk;
            if (typeof piece === "string" && piece.length > 0) {
              setProposal((prev) => prev + piece);
            }

            if (ev.done === true) {
              const id = ev.proposalId;
              if (typeof id === "string" && id.trim()) setProposalMongoId(id.trim());

              const rp = ev.replyProbability;
              if (typeof rp === "number" && !Number.isNaN(rp)) {
                setReplyProbability(rp);
              }
            }

            const errMsg = ev.error;
            if (typeof errMsg === "string" && errMsg.trim()) {
              throw new Error(errMsg);
            }
          }
          return incomplete;
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            buffer = flushSseBlocks(`${buffer}\n\n`);
            break;
          }
          buffer = flushSseBlocks(buffer + decoder.decode(value, { stream: true }));
        }
        await qc.invalidateQueries({ queryKey: ["auth"] });
        toast.success("Proposal generated ✓");
      } catch (err) {
        if (
          err instanceof TypeError ||
          (err instanceof Error && err.message.toLowerCase().includes("fetch"))
        ) {
          notifyNetworkError();
        }
        setGenerateError(err instanceof Error ? err.message : "Proposal generation failed.");
      } finally {
        setGenerating(false);
        setGenStartedAt(null);
      }
    },
    [mongoJobId, qc]
  );

  const proposalsUsed = user?.stats?.proposalsSent ?? 0;
  const freeAtLimit =
    !isGuest && user?.plan === "free" && proposalsUsed >= FREE_PROPOSAL_LIMIT;

  const handleGenerateClick = useCallback(() => {
    if (!job) return;
    if (isGuest) {
      useAppStore.getState().setShowSignupModal(true);
      return;
    }
    if (user?.plan === "free" && (user.stats?.proposalsSent ?? 0) >= FREE_PROPOSAL_LIMIT) {
      useAppStore.getState().setShowUpgradeModal(true);
      return;
    }
    void handleGenerateInternal(job);
  }, [job, isGuest, user, handleGenerateInternal]);

  /** After global signup (no pending job from Jobs), Proposal Writer runs generate from this tab. */
  useEffect(() => {
    const onSignup = (): void => {
      if (!job || !jobIdFromQuery?.trim()) return;
      void handleGenerateInternal(job);
    };
    window.addEventListener("pa-registration-success", onSignup);
    return () => window.removeEventListener("pa-registration-success", onSignup);
  }, [job, jobIdFromQuery, handleGenerateInternal]);

  /** Tick while generating so elapsed time crosses the ~2s checklist boundary. */
  useEffect(() => {
    if (!generating) return;
    const id = window.setInterval(() => setGenTick((x) => x + 1), 200);
    return () => window.clearInterval(id);
  }, [generating]);

  /** Auto-run once after job resolves for this route */
  const autoRanForKey = useRef<string | null>(null);
  useEffect(() => {
    autoRanForKey.current = null;
  }, [jobIdFromQuery]);

  useEffect(() => {
    if (!jobIdFromQuery || !job || loadError) return;
    if (isGuest) return;
    if (authLoading || (isAuthenticated && !user)) return;
    if (user?.plan === "free" && (user.stats?.proposalsSent ?? 0) >= FREE_PROPOSAL_LIMIT) return;

    const idKey = mongoJobId;
    const key = `${jobIdFromQuery}:${idKey}`;
    if (autoRanForKey.current === key) return;
    autoRanForKey.current = key;
    void handleGenerateInternal(job);
  }, [
    job,
    jobIdFromQuery,
    loadError,
    mongoJobId,
    handleGenerateInternal,
    isGuest,
    authLoading,
    isAuthenticated,
    user,
  ]);

  const copyProposal = () => {
    void navigator.clipboard.writeText(proposal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const markSent = async (): Promise<void> => {
    if (!proposalMongoId) return;
    setMarkSentError(null);
    setMarkSentLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/proposals/${proposalMongoId}/mark-sent`), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...authHeaders(),
        },
      });
      if (!res.ok) {
        await notifyHttpError(res);
        const json = await res.json().catch(() => ({}));
        const msg =
          json &&
          typeof json === "object" &&
          "message" in json &&
          typeof (json as { message: unknown }).message === "string"
            ? (json as { message: string }).message
            : "Could not mark as sent.";
        throw new Error(msg);
      }
      toast.success("Proposal sent ✓");
    } catch (e) {
      if (
        e instanceof TypeError ||
        (e instanceof Error && e.message.toLowerCase().includes("fetch"))
      ) {
        notifyNetworkError();
      }
      setMarkSentError(e instanceof Error ? e.message : "Could not mark as sent.");
    } finally {
      setMarkSentLoading(false);
    }
  };

  if (!jobIdFromQuery?.trim()) {
    return (
      <div className="animate-slideUp px-5 py-16 text-center">
        <div className="mb-4 text-4xl">🎯</div>
        <div className="mb-2 font-display text-lg text-text">Select a job to generate a proposal</div>
        <p className="mb-5 text-sm text-textMuted">
          Go to Job Matches and click &quot;Generate AI proposal&quot; on any job
        </p>
        <Btn onClick={() => router.push("/dashboard/jobs")}>
          <Icon name="target" size={13} /> Browse job matches
        </Btn>
      </div>
    );
  }

  if (loadError || !job) {
    const showSpinner = loadError === null && !job && jobIdFromQuery;
    if (showSpinner) {
      return (
        <div className="animate-slideUp px-5 py-16 text-center">
          <div className="mb-4 animate-pulse text-accent">
            <Icon name="sparkle" size={32} />
          </div>
          <p className="text-sm text-textMuted">Loading job…</p>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-danger/40 bg-dangerDim/40 px-5 py-8 text-center">
        <p className="mb-5 text-danger">{loadError ?? "Could not load this job."}</p>
        <Btn variant="ghost" onClick={() => router.push("/dashboard/jobs")}>
          <Icon name="target" size={13} /> Back to jobs
        </Btn>
      </div>
    );
  }

  const clientObj = job.client ?? {};
  const platformStr = typeof job.platform === "string" ? job.platform : "—";
  const sourceUrl = getJobSourceUrl(job);

  void genTick;
  const checklistPhase =
    generating && genStartedAt !== null && Date.now() - genStartedAt < 2000;

  return (
    <div className="animate-slideUp">
      {generateError ? (
        <div className="mb-4 rounded-lg border border-danger/40 bg-dangerDim/40 px-3 py-2 text-sm text-danger">
          {generateError}
        </div>
      ) : null}
      {markSentError ? (
        <div className="mb-4 rounded-lg border border-danger/40 bg-dangerDim/40 px-3 py-2 text-sm text-danger">
          {markSentError}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] border border-border bg-surface px-4 py-3">
        <ScoreRing score={jobScore(job)} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-semibold text-text">
            {typeof job.title === "string" ? job.title : "Job"}
          </div>
          <div className="text-xs text-textMuted">
            {platformStr}
            {" · "}
            {typeof job.budget === "string" ? job.budget : "—"}
            {" · "}
            {typeof clientObj.country === "string"
              ? clientObj.country
              : "—"}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-xs font-medium text-accentText hover:border-accent/50"
            >
              <Icon name="arrow" size={12} />
              View on {platformStr} ↗
            </a>
          ) : null}
          <Btn variant="ghost" className="text-xs" onClick={() => router.push("/dashboard/jobs")}>
            ← Change job
          </Btn>
        </div>
      </div>

      {checklistPhase ? (
        <div className="rounded-xl border border-border bg-surface px-8 py-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2.5">
            <span className="animate-pulse text-accent">
              <Icon name="sparkle" size={24} />
            </span>
            <span className="font-display text-base text-text">Generating personalized proposal...</span>
          </div>
          {[
            "Researching client background",
            "Analyzing your best-fit projects",
            "Crafting personalized opening hook",
            "Building milestone structure",
            "Optimizing for reply rate",
          ].map((step, i) => (
            <div
              key={step}
              className="mb-1 flex animate-pulse items-center justify-center gap-1.5 text-xs text-textMuted"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              <span className="h-1 w-1 rounded-full bg-accent" />
              {step}
            </div>
          ))}
        </div>
      ) : generating ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-textMuted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Streaming from Claude…
          </div>
          <textarea
            ref={proposalRef}
            rows={16}
            value={proposal}
            readOnly
            placeholder="Awaiting tokens…"
            className="w-full resize-y rounded-[10px] border border-border bg-surfaceHover px-3.5 py-3.5 text-sm leading-relaxed text-text outline-none placeholder:text-textDim focus:border-accent"
          />
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] text-textMuted">
                AI-generated proposal · Edit before sending
              </span>
              <div className="flex flex-wrap gap-2">
                <Btn
                  variant="ghost"
                  onClick={() => handleGenerateClick()}
                  disabled={generating}
                >
                  <Icon name="refresh" size={13} />
                  {freeAtLimit
                    ? "Upgrade to generate"
                    : proposal.trim().length === 0
                      ? "Generate AI Proposal"
                      : "Regenerate"}
                </Btn>
                <Btn
                  variant="ghost"
                  disabled={markSentLoading || !proposalMongoId}
                  onClick={() => void markSent()}
                >
                  {markSentLoading ? (
                    "Marking..."
                  ) : (
                    <>
                      <Icon name="send" size={13} /> Mark as Sent
                    </>
                  )}
                </Btn>
                <Btn variant={copied ? "success" : "primary"} onClick={copyProposal}>
                  {copied ? (
                    <>
                      <Icon name="check" size={13} /> Copied!
                    </>
                  ) : (
                    <>
                      <Icon name="copy" size={13} /> Copy proposal
                    </>
                  )}
                </Btn>
              </div>
            </div>
            {!isGuest && user?.plan === "free" ? (
              <div className="mt-3 w-full">
                <p className="text-[12px] text-textMuted">
                  {Math.min(proposalsUsed, FREE_PROPOSAL_LIMIT)} of {FREE_PROPOSAL_LIMIT} free
                  proposals used
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{
                      width: `${Math.min(100, (Math.min(proposalsUsed, FREE_PROPOSAL_LIMIT) / FREE_PROPOSAL_LIMIT) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
          <textarea
            ref={proposalRef}
            rows={16}
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            className="w-full resize-y rounded-[10px] border border-border bg-surfaceHover px-3.5 py-3.5 text-sm leading-relaxed text-text outline-none placeholder:text-textDim focus:border-accent"
          />
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {(
              [
                {
                  label: "Estimated read time",
                  val: "45 sec",
                  color: "text-accent",
                },
                {
                  label: "Word count",
                  val:
                    proposal.trim().length === 0
                      ? "0 words"
                      : `${proposal.trim().split(/\s+/).length} words`,
                  color: "text-purple",
                },
                {
                  label: "Win probability",
                  val: `~${Math.round(replyProbability)}%`,
                  color: "text-success",
                },
              ] as const
            ).map((m) => (
              <div
                key={m.label}
                className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-center"
              >
                <div className="mb-1 text-[11px] text-textMuted">{m.label}</div>
                <div className={cn("font-display text-lg font-bold", m.color)}>{m.val}</div>
              </div>
            ))}
          </div>
          {proposal.trim().length > 0 && sourceUrl ? (
            <div className="mt-4 rounded-[10px] border border-border bg-surface px-4 py-3">
              <p className="mb-3 text-xs leading-relaxed text-textMuted">
                Copy your proposal, open the original {platformStr} listing, paste and submit
                there — then tap <strong className="text-text">Mark as Sent</strong> here to
                start follow-ups.
              </p>
              <Btn
                onClick={() => window.open(sourceUrl, "_blank", "noopener,noreferrer")}
              >
                <Icon name="send" size={13} />
                Open original listing on {platformStr} ↗
              </Btn>
            </div>
          ) : null}
          <div className="mt-4 rounded-[10px] border border-accent/30 bg-accentDim px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-accentText">
              <Icon name="zap" size={13} /> Follow-up sequence generated automatically
            </div>
            <p className="text-xs text-textMuted">
              Day 3, Day 7, and Day 14 follow-ups queued in your sequence tracker.{" "}
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 text-xs text-accent hover:underline"
                onClick={() => router.push("/dashboard/sequences")}
              >
                View sequences →
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
