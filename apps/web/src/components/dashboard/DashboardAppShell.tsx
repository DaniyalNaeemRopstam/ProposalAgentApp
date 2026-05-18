"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/dashboard/Icon";
import { StatCard } from "@/components/ui/StatCard";
import { useSocket } from "@/hooks/useSocket";
import { useAnalyticsOverview } from "@/hooks/useAnalytics";
import { GuestBanner } from "@/components/GuestBanner";
import { useAuth } from "@/context/AuthContext";
import { DEMO_ANALYTICS_OVERVIEW } from "@proposalagent/shared";
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
  const router = useRouter();
  const { user, logout, isGuest, isAuthenticated } = useAuth();
  const { data: overview } = useAnalyticsOverview();

  const [liveEvents, setLiveEvents] = useState(0);
  const [jobsNavBadge, setJobsNavBadge] = useState(0);
  const [statPulse, setStatPulse] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("pa_jobs_nav_badge");
    if (raw) {
      const n = Math.min(Math.max(0, parseInt(raw, 10) || 0), 999);
      if (n > 0) setJobsNavBadge(n);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (showUserMenu || mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu, mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push("/");
  };

  useSocket({
    onSidebarJobsBump: () => {
      setJobsNavBadge((n) => {
        const next = Math.min(n + 1, 999);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("pa_jobs_nav_badge", String(next));
        }
        return next;
      });
    },
    onLiveActivityBump: () => setLiveEvents((n) => Math.min(n + 1, 999)),
    onStatsBump: () => setStatPulse(true),
  });

  useEffect(() => {
    if (pathname === "/dashboard/jobs" || pathname.startsWith("/dashboard/jobs/")) {
      setJobsNavBadge(0);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("pa_jobs_nav_badge");
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!statPulse) return;
    const t = window.setTimeout(() => setStatPulse(false), 750);
    return () => clearTimeout(t);
  }, [statPulse]);

  const stats = isGuest ? DEMO_ANALYTICS_OVERVIEW : overview;
  const sent = stats?.proposalsSent ?? 0;
  const replyRate = stats?.replyRate ?? 0;
  const winRate = stats?.winRate ?? 0;
  const revenueK = stats != null ? (stats.revenueWon ?? 0) / 1000 : 0;

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-border bg-surface px-3 py-6 lg:flex">
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

      {/* Mobile sidebar */}
      <aside 
        ref={mobileMenuRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[280px] flex-col border-r border-border bg-surface px-3 py-6 transition-transform duration-300 ease-in-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between px-2">
          <div>
            <div className="font-display text-sm font-bold tracking-tight text-text">Menu</div>
            <div className="mt-1 text-[10px] text-textMuted">ProposalAgent workspace</div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-textMuted hover:bg-surfaceHover hover:text-text transition-colors"
            aria-label="Close menu"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.href === "/dashboard/jobs" && jobsNavBadge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
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
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-bg px-4 py-4 sm:px-6 sm:py-7">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surfaceHover text-textMuted hover:border-borderBright hover:text-text transition-colors lg:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" size={18} />
            </button>
            
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border bg-accentDim"
              style={{ borderColor: C.accent, color: C.accent }}
            >
              <Icon name="zap" size={18} />
            </div>
            <div className="hidden sm:block">
              <div className="font-display text-lg font-bold tracking-tight" style={{ color: C.text }}>
                ProposalAgent
              </div>
              <div className="text-[11px] text-textMuted">
                DanielForge Technologies · AI Client Acquisition
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              title="Real-time dashboard activity"
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 sm:flex"
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
            
            {/* Mobile live indicator (just the dot) */}
            <div
              title="Real-time dashboard activity"
              className="flex h-9 w-9 items-center justify-center sm:hidden"
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
            </div>
            {isGuest ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-textMuted transition-colors hover:border-borderBright hover:text-text"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-all hover:bg-[#6B8FFF]"
                >
                  Sign up free
                </Link>
              </div>
            ) : (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surfaceHover text-textMuted hover:border-borderBright hover:text-text transition-colors"
                  aria-label="Account"
                >
                  <Icon name="user" size={18} />
                </button>
                {user?.plan ? (
                  <span
                    className="pointer-events-none absolute -bottom-1 -right-1 rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide"
                    style={{ background: C.accentDim, color: C.accentText }}
                  >
                    {user.plan}
                  </span>
                ) : null}
                {showUserMenu && user && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface shadow-lg z-50"
                    style={{ boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)` }}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <div className="text-sm font-medium text-text">{user.name}</div>
                      <div className="text-xs text-textMuted mt-1">{user.email}</div>
                      {user.companyName ? (
                        <div className="text-xs text-textMuted">{user.companyName}</div>
                      ) : null}
                    </div>
                    <div className="px-2 py-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-textMuted hover:bg-surfaceHover hover:text-text transition-colors"
                      >
                        <Icon name="logout" size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <GuestBanner />

        <div
          className={cn(
            "shrink-0 border-b border-border bg-bg px-4 pb-4 pt-4 transition-[box-shadow] duration-500 sm:px-6 sm:pb-6",
            statPulse && "ring-2 ring-inset"
          )}
          style={
            statPulse
              ? { boxShadow: `inset 0 0 0 1px ${C.success}55` }
              : undefined
          }
        >
          <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
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

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
          <div className="mx-auto max-w-[900px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
