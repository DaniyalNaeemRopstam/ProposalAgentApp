"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/dashboard/Icon";
import { StatCard } from "@/components/ui/StatCard";
import { useSocket } from "@/hooks/useSocket";
import { useAnalyticsOverview } from "@/hooks/useAnalytics";
import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard/jobs", label: "Jobs", icon: "target" as const },
  { href: "/dashboard/proposals", label: "Proposal", icon: "sparkle" as const },
  { href: "/dashboard/sequences", label: "Sequences", icon: "clock" as const },
  { href: "/dashboard/pipeline", label: "Pipeline", icon: "trending" as const },
  { href: "/dashboard/analytics", label: "Analytics", icon: "bar" as const },
  { href: "/dashboard/settings", label: "Settings", icon: "user" as const },
];

function CountUpInt({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const target = value;
    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    const dur = 520;
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setDisplay(Math.round(from + (target - from) * t));
      if (t < 1) frame = requestAnimationFrame(step);
      else fromRef.current = target;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

function CountUpRate({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const target = value;
    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    const dur = 520;
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const v = from + (target - from) * t;
      setDisplay(Math.round(v * 10) / 10);
      if (t < 1) frame = requestAnimationFrame(step);
      else fromRef.current = target;
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}%</>;
}

export function DashboardAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: overview } = useAnalyticsOverview();

  const [liveEvents, setLiveEvents] = useState(0);
  const [jobsNavBadge, setJobsNavBadge] = useState(0);
  const [statPulse, setStatPulse] = useState(false);

  useSocket({
    onSidebarJobsBump: () => setJobsNavBadge((n) => Math.min(n + 1, 999)),
    onLiveActivityBump: () => setLiveEvents((n) => Math.min(n + 1, 999)),
    onStatsBump: () => setStatPulse(true),
  });

  useEffect(() => {
    if (pathname === "/dashboard/jobs" || pathname.startsWith("/dashboard/jobs/")) {
      setJobsNavBadge(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!statPulse) return;
    const t = window.setTimeout(() => setStatPulse(false), 750);
    return () => clearTimeout(t);
  }, [statPulse]);

  const sent = overview?.proposalsSent ?? 0;
  const replyRate = overview?.replyRate ?? 0;
  const winRate = overview?.winRate ?? 0;
  const revenueK = overview != null ? (overview.revenueWon ?? 0) / 1000 : 0;

  return (
    <div className="flex min-h-screen bg-bg text-text">

      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-surface px-3 py-6">
        <div className="mb-8 px-2">
          <div className="font-display text-sm font-bold tracking-tight text-text">Menu</div>
          <div className="mt-1 text-[10px] text-textMuted">ProposalAgent workspace</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.href === "/dashboard/jobs" && jobsNavBadge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
                  active
                    ? "border border-borderBright bg-accentDim font-medium text-text"
                    : "border border-transparent font-normal text-textMuted hover:bg-surfaceHover hover:text-text"
                )}
              >
                <span className={active ? "text-accent" : "text-textMuted"}>
                  <Icon name={item.icon} size={14} />
                </span>
                <span className="flex-1">{item.label}</span>
                {showBadge ? (
                  <span
                    className={cn(
                      "flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-px",
                      "text-[10px] font-semibold text-white"
                    )}
                    style={{ background: C.accent }}
                  >
                    {jobsNavBadge > 99 ? "99+" : jobsNavBadge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-bg px-6 py-7">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border bg-accentDim"
              style={{ borderColor: C.accent, color: C.accent }}
            >
              <Icon name="zap" size={18} />
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight" style={{ color: C.text }}>
                ProposalAgent
              </div>
              <div className="text-[11px] text-textMuted">
                DanielForge Technologies · AI Client Acquisition
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              title="Real-time dashboard activity"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                background: C.successDim,
                border: `1px solid ${C.success}30`,
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
                  style={{ background: C.success }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ background: C.success }}
                />
              </span>
              <span className="text-[11px] font-medium" style={{ color: C.success }}>
                {liveEvents === 0 ? "Live" : `${liveEvents} updates`}
              </span>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surfaceHover text-textMuted hover:border-borderBright hover:text-text"
              aria-label="Account"
            >
              <Icon name="user" size={18} />
            </button>
          </div>
        </header>

        <div
          className={cn(
            "shrink-0 border-b border-border bg-bg px-6 pb-6 pt-4 transition-[box-shadow] duration-500",
            statPulse && "ring-2 ring-inset"
          )}
          style={
            statPulse
              ? { boxShadow: `inset 0 0 0 1px ${C.success}55` }
              : undefined
          }
        >
          <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-2.5 md:grid-cols-4">
            <StatCard
              label="Proposals sent"
              value={<CountUpInt value={sent} />}
              accentColor={C.accent}
              icon={<Icon name="send" size={18} />}
            />
            <StatCard
              label="Reply rate"
              value={<CountUpRate value={replyRate} />}
              accentColor={C.purple}
              icon={<Icon name="mail" size={18} />}
            />
            <StatCard
              label="Win rate"
              value={<CountUpRate value={winRate} />}
              accentColor={C.success}
              icon={<Icon name="target" size={18} />}
            />
            <StatCard
              label="Revenue won"
              value={`$${revenueK.toFixed(1)}k`}
              accentColor={C.teal}
              icon={<Icon name="trending" size={18} />}
            />
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-6 pb-10 pt-6">
          <div className="mx-auto max-w-[900px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
