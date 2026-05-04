"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/dashboard/Icon";
import { StatCard } from "@/components/ui/StatCard";
import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/jobs", label: "Jobs", icon: "target" as const },
  { href: "/proposals", label: "Proposal", icon: "sparkle" as const },
  { href: "/sequences", label: "Sequences", icon: "clock" as const },
  { href: "/pipeline", label: "Pipeline", icon: "trending" as const },
  { href: "/analytics", label: "Analytics", icon: "bar" as const },
  { href: "/settings", label: "Settings", icon: "user" as const },
];

function useDemoStats() {
  const stats = { sent: 23, replied: 7, won: 3, revenue: 18400 };
  const winRate = stats.sent ? Math.round((stats.won / stats.sent) * 100) : 0;
  const replyRate = stats.sent ? Math.round((stats.replied / stats.sent) * 100) : 0;
  return { stats, winRate, replyRate };
}

export function DashboardAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { stats, winRate, replyRate } = useDemoStats();

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
                {item.label}
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
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                background: C.successDim,
                border: `1px solid ${C.success}30`,
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-pulse rounded-full opacity-75"
                  style={{ background: C.success }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: C.success }}
                />
              </span>
              <span className="text-[11px] font-medium" style={{ color: C.success }}>
                3 new matches
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

        <div className="shrink-0 border-b border-border bg-bg px-6 pb-6 pt-4">
          <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-2.5 md:grid-cols-4">
            <StatCard
              label="Proposals sent"
              value={stats.sent}
              accentColor={C.accent}
              icon={<Icon name="send" size={18} />}
            />
            <StatCard
              label="Reply rate"
              value={`${replyRate}%`}
              accentColor={C.purple}
              icon={<Icon name="mail" size={18} />}
            />
            <StatCard
              label="Win rate"
              value={`${winRate}%`}
              accentColor={C.success}
              icon={<Icon name="target" size={18} />}
            />
            <StatCard
              label="Revenue won"
              value={`$${(stats.revenue / 1000).toFixed(1)}k`}
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
