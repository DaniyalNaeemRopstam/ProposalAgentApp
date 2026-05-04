"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Btn } from "@/components/ui/Btn";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Icon } from "@/components/dashboard/Icon";
import { cn } from "@/lib/cn";
import { apiUrl, authHeaders, parseEnvelope } from "@/lib/api";
import { streamProposalContent } from "@/lib/streamProposal";

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
  client?: Record<string, unknown>;
};

interface GenerateEnvelope {
  proposal: {
    _id: string;
    content?: string;
    replyProbability?: number;
    proposalScore?: number;
  };
  wordCount?: number;
  replyProbability: number;
  proposalScore: number;
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
  const jobIdFromQuery = searchParams.get("jobId");

  const [job, setJob] = useState<ApiJobRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState("");
  const [copied, setCopied] = useState(false);
  const [proposalMongoId, setProposalMongoId] = useState<string | null>(null);
  const [replyProbability, setReplyProbability] = useState(68);
  const proposalRef = useRef<HTMLTextAreaElement>(null);

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
      try {
        const res = await fetch(apiUrl(`/api/jobs/${jobIdFromQuery.trim()}`), {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });
        const json = (await res.json()) as unknown;
        if (!res.ok) {
          const msg =
            json &&
            typeof json === "object" &&
            "message" in json &&
            typeof (json as { message: unknown }).message === "string"
              ? (json as { message: string }).message
              : "Unable to load job.";
          throw new Error(msg);
        }
        const data = parseEnvelope<ApiJobRecord>(json);
        if (!cancelled) setJob(data);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Failed to load job.");
          setJob(null);
        }
      }
    }

    void fetchJob();
    return () => {
      cancelled = true;
    };
  }, [jobIdFromQuery]);

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
        const body = buildGenerateBody(sourceJob, jid);
        const res = await fetch(apiUrl("/api/proposals/generate"), {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(body),
        });

        const json = (await res.json()) as unknown;
        if (!res.ok) {
          const msg =
            json &&
            typeof json === "object" &&
            "message" in json &&
            typeof (json as { message: unknown }).message === "string"
              ? (json as { message: string }).message
              : "Proposal generation failed.";
          throw new Error(msg);
        }

        const envelope = parseEnvelope<GenerateEnvelope>(json);
        const content = envelope.proposal?.content ?? "";
        const rp = envelope.replyProbability ?? envelope.proposal.replyProbability ?? 68;
        const id = envelope.proposal?._id ? String(envelope.proposal._id) : null;

        if (id) setProposalMongoId(id);
        setReplyProbability(typeof rp === "number" && !Number.isNaN(rp) ? rp : 68);
        setGenerating(false);

        setProposal("");
        await streamProposalContent(content, setProposal);
      } catch (err) {
        setGenerating(false);
        setGenerateError(err instanceof Error ? err.message : "Proposal generation failed.");
      }
    },
    [mongoJobId]
  );

  /** Auto-run once after job resolves for this route */
  const autoRanForKey = useRef<string | null>(null);
  useEffect(() => {
    autoRanForKey.current = null;
  }, [jobIdFromQuery]);

  useEffect(() => {
    if (!jobIdFromQuery || !job || loadError) return;
    const idKey = mongoJobId;
    const key = `${jobIdFromQuery}:${idKey}`;
    if (autoRanForKey.current === key) return;
    autoRanForKey.current = key;
    void handleGenerateInternal(job);
  }, [job, jobIdFromQuery, loadError, mongoJobId, handleGenerateInternal]);

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
      const res = await fetch(apiUrl(`/api/proposals/${proposalMongoId}/status`), {
        method: "PUT",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ status: "sent" }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg =
          json &&
          typeof json === "object" &&
          "message" in json &&
          typeof (json as { message: unknown }).message === "string"
            ? (json as { message: string }).message
            : "Could not mark as sent.";
        throw new Error(msg);
      }
    } catch (e) {
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
        <Btn onClick={() => router.push("/jobs")}>
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
        <Btn variant="ghost" onClick={() => router.push("/jobs")}>
          <Icon name="target" size={13} /> Back to jobs
        </Btn>
      </div>
    );
  }

  const clientObj = job.client ?? {};
  const platformStr = typeof job.platform === "string" ? job.platform : "—";

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
        <Btn variant="ghost" className="ml-auto text-xs" onClick={() => router.push("/jobs")}>
          ← Change job
        </Btn>
      </div>

      {generating ? (
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
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] text-textMuted">
              AI-generated proposal · Edit before sending
            </span>
            <div className="flex flex-wrap gap-2">
              <Btn variant="ghost" onClick={() => void handleGenerateInternal(job)}>
                <Icon name="refresh" size={13} /> Regenerate
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
          <div className="mt-4 rounded-[10px] border border-accent/30 bg-accentDim px-4 py-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-accentText">
              <Icon name="zap" size={13} /> Follow-up sequence generated automatically
            </div>
            <p className="text-xs text-textMuted">
              Day 3, Day 7, and Day 14 follow-ups queued in your sequence tracker.{" "}
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 text-xs text-accent hover:underline"
                onClick={() => router.push("/sequences")}
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
