import Link from "next/link";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";

const primaryLink =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border-0 bg-accent px-5 py-2.5 font-sans text-[13px] font-medium text-white outline-none transition-all duration-150 hover:-translate-y-px hover:bg-[#6B8FFF] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const ghostLink =
  "inline-flex items-center justify-center rounded-lg border border-border bg-transparent px-4 py-2 font-sans text-[13px] font-medium text-textMuted outline-none transition-all duration-150 hover:border-borderBright hover:bg-surfaceHover hover:text-text focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const secondaryLink =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-borderBright bg-surface px-5 py-2.5 font-sans text-[13px] font-medium text-text transition-all hover:bg-surfaceHover";

const featureCard =
  "group rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-accent/50 hover:shadow-[0_0_24px_rgba(79,124,255,0.12)]";

const pricingBase =
  "flex flex-col rounded-xl border bg-surface p-6 transition-shadow duration-200";

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "",
    highlight: false,
    features: [
      "5 proposals / month",
      "Upwork only",
      "AI job scoring",
      "Basic analytics",
    ],
    cta: "Start free",
    href: "/register",
  },
  {
    name: "Solo",
    price: "$49",
    period: "/mo",
    highlight: true,
    features: [
      "Unlimited proposals",
      "All platforms",
      "Follow-up sequences",
      "Win analytics & insights",
      "AI proposal writer",
    ],
    cta: "Get Solo",
    href: "/register",
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    highlight: false,
    features: [
      "Everything in Solo",
      "3 team seats",
      "CRM pipeline",
      "Cold outreach tools",
      "Contracts & templates",
    ],
    cta: "Get Pro",
    href: "/register",
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/mo",
    highlight: false,
    features: [
      "Everything in Pro",
      "10 seats",
      "API access",
      "White-label options",
      "Priority support",
    ],
    cta: "Contact sales",
    href: "/register",
  },
] as const;

const FEATURES = [
  {
    icon: "⚡",
    title: "AI Job Matching",
    desc: "Surface high-fit roles before you waste connects. Scoring tuned to your stack, rates, and win history.",
  },
  {
    icon: "✍️",
    title: "Proposal Writer",
    desc: "One-click drafts in your voice—hooks, milestones, and CTAs that sound like you, not generic AI slop.",
  },
  {
    icon: "📨",
    title: "Follow-up Automation",
    desc: "Day 3, 7, and 14 sequences fire automatically so warm leads don't go cold while you're in deep work.",
  },
  {
    icon: "📊",
    title: "Win Analytics",
    desc: "See reply rate, win rate, and revenue in one strip—know which platforms and pitches actually convert.",
  },
  {
    icon: "🤝",
    title: "CRM Pipeline",
    desc: "Track sent → replied → won without another spreadsheet. Status syncs across proposals and sequences.",
  },
  {
    icon: "🧠",
    title: "AI Coaching Insights",
    desc: "Claude-powered coaching on what's working and what to tweak—so every proposal gets sharper over time.",
  },
] as const;

function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-bg/75 backdrop-blur-md">
      <div className="mx-auto flex min-h-[3.5rem] max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-3 md:h-14 md:flex-nowrap md:px-6 md:py-0">
        <Link
          href="/"
          className="font-display text-[15px] font-bold tracking-tight text-text"
          style={{ color: C.text }}
        >
          ⚡ ProposalAgent
        </Link>
        <nav className="flex items-center gap-4 text-[12px] font-medium text-textMuted sm:gap-6 md:gap-8 md:text-[13px]">
          <a href="#features" className="transition-colors hover:text-text">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-text">
            Pricing
          </a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/dashboard/jobs" className={ghostLink}>
            Try demo
          </Link>
          <Link href="/login" className={ghostLink}>
            Sign in
          </Link>
          <Link href="/register" className={primaryLink}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroMockup() {
  return (
    <div
      className="animate-heroFloat relative mx-auto w-full max-w-md rounded-2xl border border-borderBright bg-surface p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      style={{ boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${C.borderBright}` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-semibold text-text">FinTech MVP</div>
          <div className="mt-1 text-xs text-textMuted">React Native · Node · Plaid</div>
          <div className="mt-2 text-xs font-medium text-accentText">$8,000 – $15,000</div>
        </div>
        <ScoreRing score={96} size={56} />
      </div>
      <p className="mb-4 line-clamp-3 text-[12px] leading-relaxed text-textMuted">
        Need a senior RN dev to ship v1 of a budgeting app with bank linking. Must have production fintech
        experience…
      </p>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="w-full rounded-lg border-0 bg-accent py-2.5 text-[13px] font-semibold text-white shadow-glow-sm transition hover:bg-[#6B8FFF]"
      >
        Generate AI Proposal
      </button>
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <NavBar />

      <main>
        {/* Hero */}
        <section className="border-b border-border px-5 py-16 md:px-6 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div>
              <h1 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-text md:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                Stop Writing Proposals.
                <br />
                <span className="text-accentText">Start Winning Clients.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-textMuted md:text-base">
                ProposalAgent uses AI to match high-fit jobs, write personalized proposals in your voice, and automate
                follow-ups — so you spend time coding, not pitching.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/register" className={primaryLink + " px-6 py-3 text-[14px]"}>
                  Start free — no credit card
                </Link>
                <a href="#how" className={secondaryLink}>
                  See how it works ↓
                </a>
              </div>
            </div>
            <HeroMockup />
          </div>
        </section>

        {/* Social proof */}
        <section className="border-b border-border bg-surface/80 px-5 py-4 md:px-6">
          <p className="mx-auto max-w-4xl text-center text-[13px] leading-relaxed text-textMuted md:text-sm">
            <span className="font-medium text-text/90">57M+</span> freelancers ·{" "}
            <span className="font-medium text-text/90">$4.16B</span> market · Average win rate:{" "}
            <span style={{ color: C.danger }}>13%</span>
            {" → "}
            <span style={{ color: C.success }}>34%</span> with ProposalAgent
          </p>
        </section>

        {/* Problem vs solution */}
        <section id="how" className="border-b border-border px-5 py-16 md:px-6 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:gap-10">
            <div
              className="rounded-2xl border p-8 md:p-10"
              style={{
                borderColor: `${C.danger}33`,
                background: `linear-gradient(160deg, ${C.danger}12 0%, ${C.surface} 45%)`,
              }}
            >
              <h2 className="font-display text-xl font-bold text-danger md:text-2xl">The Problem</h2>
              <ul className="mt-6 space-y-4 text-[14px] leading-relaxed text-textMuted">
                {[
                  "Spending 30–40% of your week writing proposals instead of shipping.",
                  "AI slop flooding Upwork — clients ignore generic pitches.",
                  "No system to track follow-ups; deals die in the inbox.",
                  "No clarity on what's actually converting to replies and wins.",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger/90" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-2xl border p-8 md:p-10"
              style={{
                borderColor: `${C.success}40`,
                background: `linear-gradient(160deg, ${C.success}10 0%, ${C.surface} 45%)`,
              }}
            >
              <h2 className="font-display text-xl font-bold md:text-2xl" style={{ color: C.success }}>
                With ProposalAgent
              </h2>
              <ul className="mt-6 space-y-4 text-[14px] leading-relaxed text-textMuted">
                {[
                  "One-click AI proposals written in YOUR voice—not copy-paste templates.",
                  "Smart job matching so you only apply to high-fit opportunities.",
                  "Automated Day 3 / 7 / 14 follow-up sequences tied to each send.",
                  "Win analytics that show exactly what converts (and what doesn't).",
                ].map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border px-5 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-center text-2xl font-bold text-text md:text-3xl">
              Everything you need to close freelance deals
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] text-textMuted">
              From first match to final follow-up—one workspace built for serious independent developers.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <article key={f.title} className={featureCard}>
                  <div className="mb-3 text-2xl" aria-hidden>
                    {f.icon}
                  </div>
                  <h3 className="font-display text-base font-semibold text-text group-hover:text-accentText">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-textMuted">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-b border-border px-5 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-center text-2xl font-bold text-text md:text-3xl">
              Simple pricing that scales with you
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-[14px] text-textMuted">
              Start free, upgrade when you&apos;re ready for unlimited proposals and full platform coverage.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {PRICING.map((tier) => (
                <div
                  key={tier.name}
                  className={cn(
                    pricingBase,
                    tier.highlight
                      ? "border-accent shadow-[0_0_32px_rgba(79,124,255,0.22)] ring-1 ring-accent/40"
                      : "border-border hover:border-borderBright"
                  )}
                >
                  {tier.highlight ? (
                    <span className="mb-3 inline-block w-fit rounded-full border border-accent/50 bg-accentDim px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accentText">
                      Most popular
                    </span>
                  ) : (
                    <span className="mb-3 block h-5" aria-hidden />
                  )}
                  <div className="font-display text-lg font-bold text-text">{tier.name}</div>
                  <div className="mt-2 flex items-baseline gap-0.5">
                    <span className="text-3xl font-bold tracking-tight text-text">{tier.price}</span>
                    <span className="text-sm text-textMuted">{tier.period}</span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-2.5 text-[13px] text-textMuted">
                    {tier.features.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="text-success" aria-hidden>
                          ✓
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={tier.href} className={cn(primaryLink, "mt-8 w-full justify-center text-center")}>
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder */}
        <section className="border-b border-border px-5 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface px-8 py-10 md:px-12 md:py-12">
            <h2 className="font-display text-xl font-bold text-text md:text-2xl">
              Built by a developer who lived the problem
            </h2>
            <p className="mt-2 text-[13px] font-medium text-accentText">Daniyal Naeem · DanielForge Technologies LLC</p>
            <p className="mt-6 text-[15px] leading-relaxed text-textMuted">
              7 years of React Native development. Spent 40% of my time writing proposals. Built ProposalAgent to solve
              my own problem — now it solves yours.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-16 md:px-6 md:py-24">
          <div
            className="mx-auto max-w-3xl rounded-2xl border border-accent/25 px-8 py-12 text-center md:px-12"
            style={{
              background: `linear-gradient(180deg, ${C.accentDim} 0%, ${C.surface} 100%)`,
            }}
          >
            <h2 className="font-display text-2xl font-bold text-text md:text-3xl">Ready to win more clients?</h2>
            <p className="mt-3 text-[15px] text-textMuted">Start free — no credit card required</p>
            <Link href="/register" className={cn(primaryLink, "mt-8 px-8 py-3 text-[14px]")}>
              Start free — no credit card
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface/50 px-5 py-12 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="font-display text-base font-bold text-text">⚡ ProposalAgent</div>
            <p className="mt-2 max-w-xs text-[13px] text-textMuted">
              AI job matching, proposals in your voice, and follow-ups—so you ship more and pitch less.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] text-textMuted">
            <a href="#features" className="hover:text-text">
              Features
            </a>
            <a href="#pricing" className="hover:text-text">
              Pricing
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-text">
              Twitter
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-text">
              LinkedIn
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-center text-[12px] text-textDim md:text-left">
          © 2026 DanielForge Technologies LLC · Delaware, USA
        </p>
      </footer>
    </div>
  );
}
