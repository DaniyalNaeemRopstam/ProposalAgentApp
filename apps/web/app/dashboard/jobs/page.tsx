"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useJobs } from "@/hooks/useJobs";
import { JobSkeleton } from "@/components/skeletons/JobSkeleton";
import { Btn } from "@/components/ui/Btn";
import { PlatformBadge } from "@/components/ui/PlatformBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Tag } from "@/components/ui/Tag";
import { Icon } from "@/components/dashboard/Icon";
import { apiUrl, authHeaders } from "@/lib/api";
import { notifyHttpError } from "@/lib/apiErrors";
import toast from "react-hot-toast";
import type { Job } from "@proposalagent/shared";

export default function JobsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, error } = useJobs();
  const [customJob, setCustomJob] = useState("");
  const [showCustom, setShowCustom] = useState(false);

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

  const handleGenerateProposal = (job: Job) => {
            const jobId = (job as any)._id || (job as any).id || String(Math.random());
    router.push(
      `/dashboard/proposals?jobId=${encodeURIComponent(jobId)}`
    );
  };

  const handlePasteJob = async () => {
    if (!customJob.trim()) return;

    // Simple parsing — in real app this would use the AI research endpoint
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-textMuted">
          AI found{" "}
          <span className="font-semibold text-accent">
            {jobs.length} high-fit jobs
          </span>{" "}
          in the last 2 hours across Upwork, LinkedIn & Wellfound
        </p>
        <Btn variant="ghost" onClick={() => setShowCustom((v) => !v)}>
          <Icon name="copy" size={13} /> Paste job manually
        </Btn>
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
            <Btn
              onClick={handlePasteJob}
              disabled={saveJobMutation.isPending || !customJob.trim()}
            >
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
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surfaceHover">
            <Icon name="target" size={32} />
          </div>
          <div className="font-display mb-2 text-xl text-text">No jobs found</div>
          <p className="mx-auto max-w-xs text-textMuted">
            We couldn&apos;t find any matching jobs right now. Try pasting a job description above or check back later.
          </p>
          <Btn className="mt-6" onClick={() => setShowCustom(true)}>
            Paste a job manually
          </Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job, i) => {
            const jobId = (job as any)._id || (job as any).id || `job-${i}`;
            return (
              <div
                key={jobId}
                className="animate-slideUp cursor-pointer rounded-xl border border-border bg-surface p-5 transition-colors hover:border-borderBright"
                style={{ animationDelay: `${i * 80}ms` }}
                onClick={() => handleGenerateProposal(job)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleGenerateProposal(job);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex gap-3.5">
                  <ScoreRing score={job.score || 85} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={job.platform} />
                      <span className="font-display text-[15px] font-semibold text-text">
                        {job.title}
                      </span>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-4 text-xs text-textMuted">
                      <span className="text-[13px] font-medium text-success">
                        {job.budget}
                      </span>
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
                    <p className="mb-2.5 max-w-full truncate text-[13px] leading-relaxed text-textMuted">
                      {job.snippet}
                    </p>
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
                    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <Btn onClick={() => handleGenerateProposal(job)}>
                        <Icon name="sparkle" size={13} /> Generate AI proposal
                      </Btn>
                      <Btn variant="ghost">
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
