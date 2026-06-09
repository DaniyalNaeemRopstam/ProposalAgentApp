"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJobs, type JobsSourceFilter } from "@/hooks/useJobs";
import { useIntegrationsStatus, useSyncIntegrations } from "@/hooks/useIntegrations";
import { JobSkeleton } from "@/components/skeletons/JobSkeleton";
import { Btn } from "@/components/ui/Btn";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/dashboard/Icon";
import { apiUrl, authHeaders } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";
import toast from "react-hot-toast";
import { resolveJobListingUrl, type Job } from "@proposalagent/shared";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/appStore";
import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";
import {
  JobsSearchFilterToggle,
  JobsSearchFilterPanel,
  countActiveJobsSearchFilters,
  EMPTY_JOBS_SEARCH_FILTERS,
  type JobsSearchFilters,
} from "@/components/jobs/JobsSearchFilter";
import {
  applyJobsSearchFilters,
  collectJobPlatforms,
  collectJobSkills,
} from "@/lib/jobListFilters";

type SavedFilter = "all" | "new" | "saved";

function formatRelative(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 45) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function jobKey(job: Job, i: number): string {
  const j = job as Job & { _id?: string; id?: string };
  return j._id || j.id || `job-${i}`;
}

function DemoBadge() {
  return (
    <span
      title="Real jobs matched to your profile after signup"
      className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-textDim"
      style={{ background: C.surfaceHover }}
    >
      DEMO
    </span>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isGuest } = useAuth();
  const [sourceFilter, setSourceFilter] = useState<JobsSourceFilter>("all");
  const [savedFilter, setSavedFilter] = useState<SavedFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastSyncLabel, setLastSyncLabel] = useState<string | null>(null);
  const [lastNewCount, setLastNewCount] = useState<number | null>(null);
  const [customJob, setCustomJob] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState<JobsSearchFilters>(
    EMPTY_JOBS_SEARCH_FILTERS
  );

  const { data: jobs = [], isLoading, error, isFetching } = useJobs({
    source: sourceFilter,
    minScore: 60,
    limit: 100,
  });

  const { data: intStatus } = useIntegrationsStatus({ enabled: !isGuest });
  const syncMutation = useSyncIntegrations();

  const savedFilteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const savedAt = (job as Job & { savedAt?: string }).savedAt;
      const hasSaved = Boolean(savedAt);
      const isAgg = job.isAggregated === true;
      if (savedFilter === "saved") return hasSaved;
      if (savedFilter === "new") return isAgg && !hasSaved;
      return true;
    });
  }, [jobs, savedFilter]);

  const availablePlatforms = useMemo(
    () => collectJobPlatforms(savedFilteredJobs),
    [savedFilteredJobs]
  );
  const availableSkills = useMemo(
    () => collectJobSkills(savedFilteredJobs),
    [savedFilteredJobs]
  );

  const filteredJobs = useMemo(
    () => applyJobsSearchFilters(savedFilteredJobs, searchFilters),
    [savedFilteredJobs, searchFilters]
  );

  const saveJobMutation = useMutation({
    mutationFn: async (body: {
      jobTitle: string;
      jobDescription: string;
      jobBudget: string;
      platform: string;
      clientName: string;
      clientCountry: string;
      tags: string[];
    }) => {
      const res = await fetch(apiUrl("/api/jobs/save"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        await notifyHttpError(res);
        throw new Error("Failed to save job");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setCustomJob("");
      setShowCustom(false);
      toast.success("Job saved — analyzing…");
    },
  });

  const handleResearchClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGuest) {
      useAppStore.getState().setShowSignupModal(true);
      return;
    }
    toast("Client research opens from your connected integrations after signup.");
  };

  const handleGenerateProposal = (job: Job) => {
    if (isGuest) {
      useAppStore.getState().setPendingJobForProposal(job);
      useAppStore.getState().setShowSignupModal(true);
      return;
    }
    const jobId = (job as Job & { _id?: string; id?: string })._id || (job as Job & { id?: string }).id || String(Math.random());
    router.push(`/dashboard/proposals?jobId=${encodeURIComponent(String(jobId))}`);
  };

  const handlePasteJob = async () => {
    if (!customJob.trim()) return;
    const fakeJobData = {
      jobTitle: "Custom Pasted Job",
      jobDescription: customJob,
      jobBudget: "$5,000 – $12,000",
      platform: "Custom",
      clientName: "Pasted Client",
      clientCountry: "🌐 Global",
      tags: ["custom", "pasted"],
    };
    await saveJobMutation.mutateAsync(fakeJobData);
  };

  const aggregationLastRun = intStatus?.aggregation?.lastRun
    ? formatRelative(intStatus.aggregation.lastRun)
    : null;
  const lastRunStatsNew = intStatus?.aggregation?.lastStats?.newJobsAdded;

  const handleSyncNow = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      const stats = result.stats;
      setLastSyncLabel(formatRelative(stats.lastRun));
      setLastNewCount(stats.newJobsAdded);
      toast.success(`Synced — ${stats.newJobsAdded} new, ${stats.hotJobsFound} hot matches`);
    } catch {
      /* notifyHttpError handled */
    }
  };

  const displayLastSync = lastSyncLabel ?? aggregationLastRun;
  const displayNewCount = lastNewCount ?? lastRunStatsNew ?? 0;

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-dangerDim/30 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <Icon name="target" size={24} />
        </div>
        <p className="text-danger">Failed to load jobs. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="animate-slideUp">
      <div
        className="mb-4 rounded-xl border border-border bg-surface px-3 py-3 sm:px-4"
        style={{ borderColor: C.borderBright }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-[12px] text-textMuted sm:text-[13px]">
            <span className="text-text">Last synced:</span>{" "}
            {displayLastSync ? (
              <span className="font-medium text-text">{displayLastSync}</span>
            ) : (
              <span className="text-textDim">not yet</span>
            )}
            <span className="text-textDim"> · </span>
            <span className="font-medium" style={{ color: C.teal }}>
              {displayNewCount} new jobs
            </span>{" "}
            <span className="text-textDim">found (last worker run)</span>
          </div>
          <Btn
            onClick={() => void handleSyncNow()}
            disabled={syncMutation.isPending || isGuest}
            className="shrink-0"
          >
            {syncMutation.isPending ? (
              <>
                <span
                  className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
                Syncing…
              </>
            ) : (
              <>
                <Icon name="zap" size={13} /> Sync now
              </>
            )}
          </Btn>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3 sm:gap-2">
          <span className="self-center text-[10px] font-semibold uppercase tracking-wide text-textDim sm:text-[11px]">
            Source
          </span>
          {(
            [
              { id: "all" as const, label: "All jobs" },
              { id: "aggregated" as const, label: "Auto-matched" },
              { id: "manual" as const, label: "Manually added" },
            ] satisfies { id: JobsSourceFilter; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSourceFilter(t.id)}
              className={cn(
                "rounded-lg px-2 py-1 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-[12px]",
                sourceFilter === t.id
                  ? "bg-accentDim text-accentText ring-1 ring-accent/40"
                  : "text-textMuted hover:bg-surfaceHover hover:text-text"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
          <span className="self-center text-[10px] font-semibold uppercase tracking-wide text-textDim sm:text-[11px]">
            Filter
          </span>
          {(
            [
              { id: "all" as const, label: "All" },
              { id: "new" as const, label: "New" },
              { id: "saved" as const, label: "Saved" },
            ] satisfies { id: SavedFilter; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSavedFilter(t.id)}
              className={cn(
                "rounded-lg px-2 py-1 text-[11px] font-medium transition-colors sm:px-2.5 sm:text-[12px]",
                savedFilter === t.id
                  ? "bg-purpleDim text-purple ring-1 ring-purple/30"
                  : "text-textMuted hover:bg-surfaceHover hover:text-text"
              )}
            >
              {t.label}
            </button>
          ))}
          {isFetching && !isLoading ? (
            <span className="self-center text-[11px] text-textDim">Refreshing…</span>
          ) : null}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-textMuted sm:text-[13px]">
            AI matched{" "}
            <span className="font-semibold text-accent">{filteredJobs.length}</span> listing
            {filteredJobs.length !== 1 ? "s" : ""}
            {filteredJobs.length !== savedFilteredJobs.length ? (
              <span className="text-textDim"> · filtered from {savedFilteredJobs.length}</span>
            ) : null}
            {sourceFilter === "aggregated" ? " · Auto-fetched roles" : null}
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <JobsSearchFilterToggle
              open={showSearch}
              onToggle={() => setShowSearch((v) => !v)}
              activeCount={countActiveJobsSearchFilters(searchFilters)}
            />
            <Btn
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setShowCustom((v) => !v)}
            >
              <Icon name="copy" size={13} /> Paste job manually
            </Btn>
          </div>
        </div>

        {showSearch ? (
          <JobsSearchFilterPanel
            filters={searchFilters}
            onChange={setSearchFilters}
            onClose={() => setShowSearch(false)}
            availablePlatforms={availablePlatforms}
            availableSkills={availableSkills}
            resultCount={filteredJobs.length}
            totalCount={savedFilteredJobs.length}
          />
        ) : null}
      </div>

      {showCustom && (
        <div className="animate-slideUp mb-4 rounded-xl border border-accent bg-surface p-4">
          <p className="mb-2.5 text-[13px] text-textMuted">Paste any job description below:</p>
          <textarea
            rows={4}
            placeholder="Paste Upwork job description, LinkedIn post, or client email here..."
            value={customJob}
            onChange={(e) => setCustomJob(e.target.value)}
            className="w-full resize-y rounded-[10px] border border-border bg-surfaceHover px-3.5 py-3.5 text-sm leading-relaxed text-text outline-none placeholder:text-textDim focus:border-accent"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Btn onClick={() => void handlePasteJob()} disabled={saveJobMutation.isPending || !customJob.trim()}>
              {saveJobMutation.isPending ? "Saving..." : "Save & Analyze Job"}
            </Btn>
            <Btn variant="ghost" onClick={() => setShowCustom(false)}>
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {isLoading ? (
        <JobSkeleton />
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surfaceHover">
            <Icon name="target" size={32} />
          </div>
          <div className="font-display mb-2 text-xl text-text">No jobs found</div>
          <p className="mx-auto max-w-xs text-textMuted">
            {savedFilteredJobs.length > 0
              ? "No listings match your search or filters. Try clearing filters or broadening your query."
              : "Adjust source filters, use Search & filter, or run a sync from Settings → Integrations."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {savedFilteredJobs.length > 0 &&
            countActiveJobsSearchFilters(searchFilters) > 0 ? (
              <Btn
                variant="ghost"
                onClick={() => {
                  setSearchFilters(EMPTY_JOBS_SEARCH_FILTERS);
                  setShowSearch(false);
                }}
              >
                Clear search filters
              </Btn>
            ) : null}
            <Btn onClick={() => void handleSyncNow()} disabled={syncMutation.isPending}>
              Sync jobs now
            </Btn>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredJobs.map((job, i) => {
            const id = jobKey(job, i);
            const expanded = expandedId === id;
            const sourceUrl = resolveJobListingUrl(job);
            return (
              <div
                key={id}
                className="animate-slideUp rounded-xl border border-border bg-surface p-3 transition-colors hover:border-borderBright sm:p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex gap-2.5 sm:gap-3.5">
                  <ScoreRing score={job.score ?? 0} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <PlatformBadge platform={job.platform} />
                      {job.isDemo ? <DemoBadge /> : null}
                      {job.isAggregated ? (
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: C.tealDim, color: C.teal }}
                        >
                          Auto-matched
                        </span>
                      ) : (
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: C.purpleDim, color: C.purple }}
                        >
                          Manual
                        </span>
                      )}
                      <span className="font-display text-[14px] font-semibold text-text sm:text-[15px]">{job.title}</span>
                      <button
                        type="button"
                        className="ml-auto shrink-0 rounded-lg border border-border p-1.5 text-textMuted hover:border-borderBright hover:text-text"
                        aria-expanded={expanded}
                        aria-label={expanded ? "Collapse" : "Expand"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId((cur) => (cur === id ? null : id));
                        }}
                      >
                        <Icon name="chevronDown" size={14} className={cn("transition-transform", expanded && "rotate-180") } />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => handleGenerateProposal(job)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleGenerateProposal(job);
                        }
                      }}
                    >
                      <div className="mb-2 flex flex-wrap gap-4 text-xs text-textMuted">
                        <span className="text-[13px] font-medium text-success">{job.budget}</span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="clock" size={12} />
                          {job.posted || "just now"}
                        </span>
                        <span>
                          {job.client?.country} · {job.client?.spent || job.client?.name}
                        </span>
                        {job.client?.rating != null && (
                          <span className="inline-flex items-center gap-1 text-warn">
                            <Icon name="star" size={11} />
                            {job.client.rating}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "mb-2.5 max-w-full text-[13px] leading-relaxed text-textMuted",
                          expanded ? "whitespace-pre-wrap" : "truncate"
                        )}
                      >
                        {job.snippet}
                      </p>
                    </button>
                    {expanded && sourceUrl ? (
                      <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-accentText underline-offset-2 hover:underline"
                          style={{ background: C.accentDim }}
                        >
                          View on {job.platform} ↗
                        </a>
                      </div>
                    ) : null}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {job.tags?.map((tg) => (
                        <Tag key={tg}>{tg}</Tag>
                      ))}
                    </div>
                    {job.reasons && job.reasons.length > 0 && (
                      <div className="mb-3 rounded-lg bg-bg px-3.5 py-2.5">
                        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-textDim">
                          WHY YOU SHOULD APPLY
                        </div>
                        <ul className="flex flex-col gap-1">
                          {job.reasons.map((r, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-1.5 text-xs leading-snug text-textMuted"
                            >
                              <span className="mt-0.5 shrink-0 text-success">
                                <Icon name="check" size={11} />
                              </span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Btn onClick={() => handleGenerateProposal(job)}>
                        <Icon name="sparkle" size={13} /> Generate AI proposal
                      </Btn>
                      <Btn type="button" onClick={(e) => handleResearchClient(e)} variant="ghost">
                        <Icon name="linkedin" size={13} /> Research client
                      </Btn>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
