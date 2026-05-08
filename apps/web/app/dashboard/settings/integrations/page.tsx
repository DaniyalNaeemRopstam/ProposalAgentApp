"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Btn } from "@/components/ui/Btn";
import { Icon } from "@/components/dashboard/Icon";
import { C } from "@/styles/theme";
import {
  useIntegrationsPlatforms,
  useIntegrationsStatus,
  useSaveRapidApiKey,
  useSyncIntegrations,
} from "@/hooks/useIntegrations";
import toast from "react-hot-toast";

function formatRelativeShort(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.round((Date.now() - d.getTime()) / 1000);
  if (sec < 120) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function PlatformPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-bold"
      style={{ background: C.accentDim, color: C.accentText }}
    >
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function IntegrationsSettingsPage() {
  const { data: status, isLoading: statusLoading } = useIntegrationsStatus();
  const { data: platformsData } = useIntegrationsPlatforms();
  const syncMutation = useSyncIntegrations();
  const saveKeyMutation = useSaveRapidApiKey();
  const [linkedinKey, setLinkedinKey] = useState("");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const linkedinEnabled = platformsData?.platforms.find((p) => p.id === "linkedin")?.enabled ?? false;

  const platformMeta = useMemo(() => {
    const rows = status?.platforms ?? [];
    const map = Object.fromEntries(rows.map((r) => [r.platform, r])) as Record<
      string,
      { totalJobs: number; lastFetched?: string | null; jobsFetchedToday?: number; averageScore: number }
    >;
    return map;
  }, [status?.platforms]);

  const hnMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

  const summary = status?.summary;

  const handleSyncAll = async () => {
    setSyncMessage(null);
    try {
      const result = await syncMutation.mutateAsync();
      const stats = result.stats;
      setSyncMessage(
        `Found ${stats.newJobsAdded} new jobs · ${stats.hotJobsFound} hot matches (${stats.jobsFetched} fetched)`
      );
      toast.success("Sync complete");
    } catch {
      /* notifyHttpError */
    }
  };

  const handleSaveLinkedin = async () => {
    if (!linkedinKey.trim()) return;
    try {
      await saveKeyMutation.mutateAsync(linkedinKey.trim());
      setLinkedinKey("");
      toast.success("RapidAPI key saved");
    } catch {
      /* handled */
    }
  };

  return (
    <div className="animate-slideUp">
      <div className="mb-6">
        <Link
          href="/dashboard/settings"
          className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-textMuted hover:text-accentText"
        >
          ← Back to settings
        </Link>
        <h1 className="font-display text-2xl font-bold text-text">Integrations</h1>
        <p className="mt-1 text-[14px] text-textMuted">
          Connect job sources and run manual syncs for your ProposalAgent feed
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* Upwork */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-start gap-3">
            <PlatformPlaceholder label="Up" />
            <div>
              <div className="font-display text-[15px] font-semibold text-text">Upwork</div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: C.success }}>
                Connected via RSS feed ✓
              </div>
            </div>
          </div>
          <p className="text-[13px] text-textMuted">
            Jobs fetched today:{" "}
            <span className="font-semibold text-text">{platformMeta["Upwork"]?.jobsFetchedToday ?? 0}</span>
          </p>
          <p className="mt-1 text-[13px] text-textMuted">
            Last sync:{" "}
            <span className="text-text">
              {formatRelativeShort(platformMeta["Upwork"]?.lastFetched ?? status?.aggregation?.lastRun)}
            </span>
          </p>
          <p className="mt-3 text-[12px] text-textDim">Upwork OAuth available on Enterprise plan</p>
        </div>

        {/* LinkedIn */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-start gap-3">
            <PlatformPlaceholder label="Li" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] font-semibold text-text">LinkedIn</div>
              {linkedinEnabled ? (
                <div className="mt-1 text-[12px] font-medium" style={{ color: C.success }}>
                  Connected ✓
                </div>
              ) : (
                <div className="mt-1 text-[12px] font-medium text-warn">Setup required</div>
              )}
            </div>
          </div>
          {linkedinEnabled ? (
            <>
              <p className="text-[13px] text-textMuted">
                Aggregated jobs:{" "}
                <span className="font-semibold text-text">{platformMeta["LinkedIn"]?.totalJobs ?? 0}</span>
              </p>
              <p className="mt-1 text-[13px] text-textMuted">
                Last sync:{" "}
                <span className="text-text">{formatRelativeShort(platformMeta["LinkedIn"]?.lastFetched)}</span>
              </p>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-textDim">
                RapidAPI key
              </label>
              <input
                type="password"
                autoComplete="off"
                value={linkedinKey}
                onChange={(e) => setLinkedinKey(e.target.value)}
                placeholder="Paste key from RapidAPI"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[13px] text-text outline-none focus:border-accent"
              />
              <a
                href="https://rapidapi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-[12px] text-accentText hover:underline"
              >
                Get a key at rapidapi.com ↗
              </a>
              <div className="pt-2">
                <Btn onClick={() => void handleSaveLinkedin()} disabled={saveKeyMutation.isPending || !linkedinKey.trim()}>
                  {saveKeyMutation.isPending ? "Saving…" : "Save key"}
                </Btn>
              </div>
            </div>
          )}
        </div>

        {/* Wellfound */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-start gap-3">
            <PlatformPlaceholder label="Wf" />
            <div>
              <div className="font-display text-[15px] font-semibold text-text">Wellfound</div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: C.success }}>
                Auto-enabled ✓
              </div>
            </div>
          </div>
          <p className="text-[13px] text-textMuted">
            Jobs in feed:{" "}
            <span className="font-semibold text-text">{platformMeta["Wellfound"]?.totalJobs ?? 0}</span>
          </p>
          <p className="mt-1 text-[13px] text-textMuted">
            Last fetch:{" "}
            <span className="text-text">{formatRelativeShort(platformMeta["Wellfound"]?.lastFetched)}</span>
          </p>
          <p className="mt-3 text-[12px] text-textDim">Startup jobs · Seed to Series B</p>
        </div>

        {/* Hacker News */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-start gap-3">
            <PlatformPlaceholder label="HN" />
            <div>
              <div className="font-display text-[15px] font-semibold text-text">Hacker News</div>
              <div className="mt-1 text-[12px] font-medium" style={{ color: C.success }}>
                Auto-enabled ✓
              </div>
            </div>
          </div>
          <p className="text-[13px] text-textMuted">
            Monthly hiring thread · <span className="text-text">{hnMonth}</span>
          </p>
          <p className="mt-2 text-[13px] text-textMuted">
            Jobs in feed:{" "}
            <span className="font-semibold text-text">{platformMeta["HackerNews"]?.totalJobs ?? 0}</span>
          </p>
          <p className="mt-1 text-[13px] text-textMuted">
            Last fetch:{" "}
            <span className="text-text">{formatRelativeShort(platformMeta["HackerNews"]?.lastFetched)}</span>
          </p>
        </div>
      </div>

      <div
        className="mb-8 rounded-xl border border-border bg-surface p-6"
        style={{ borderColor: C.borderBright }}
      >
        <h2 className="mb-2 font-display text-lg font-semibold text-text">Manual sync</h2>
        <p className="mb-4 text-[13px] text-textMuted">
          Pull fresh listings from every platform, score with AI, and push hot matches to your queue.
        </p>
        <Btn onClick={() => void handleSyncAll()} disabled={syncMutation.isPending}>
          {syncMutation.isPending ? (
            <>
              <span
                className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              Fetching jobs… (this can take ~30 seconds)
            </>
          ) : (
            <>
              <Icon name="refresh" size={14} /> Sync all platforms now
            </>
          )}
        </Btn>
        {syncMessage ? (
          <p className="mt-3 text-[13px] font-medium" style={{ color: C.success }}>
            {syncMessage}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-text">Aggregation stats</h2>
        {statusLoading && !summary ? (
          <p className="text-textMuted">Loading…</p>
        ) : (
          <ul className="grid gap-3 text-[13px] sm:grid-cols-2">
            <li className="text-textMuted">
              Total jobs in database:{" "}
              <span className="font-semibold text-text">{summary?.totalJobsInDatabase ?? "—"}</span>
            </li>
            <li className="text-textMuted">
              Jobs added this week:{" "}
              <span className="font-semibold text-text">{summary?.jobsAddedThisWeek ?? "—"}</span>
            </li>
            <li className="text-textMuted">
              Most active platform:{" "}
              <span className="font-semibold text-text">{summary?.mostActivePlatform ?? "—"}</span>
            </li>
            <li className="text-textMuted">
              Avg score (aggregated):{" "}
              <span className="font-semibold text-text">
                {summary?.averageScoreOfAggregated != null ? `${summary.averageScoreOfAggregated}` : "—"}
              </span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
