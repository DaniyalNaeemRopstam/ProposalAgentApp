import { useState, useEffect, useRef } from "react";

const API_KEY_PLACEHOLDER = ""; // Claude API handled by platform

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#0A0C10",
  surface: "#111318",
  surfaceHover: "#181C24",
  border: "#1E2330",
  borderBright: "#2E3550",
  accent: "#4F7CFF",
  accentDim: "#1E2D5F",
  accentText: "#8AAEFF",
  success: "#22D07A",
  successDim: "#0D3020",
  warn: "#F59E0B",
  warnDim: "#2D2000",
  danger: "#F56060",
  text: "#F0F2F8",
  textMuted: "#6B7394",
  textDim: "#3A4060",
  purple: "#A78BFA",
  purpleDim: "#2D1F5A",
  teal: "#2DD4BF",
  tealDim: "#0D2E2A",
};

const fonts = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
`;

// ─── Sample data ──────────────────────────────────────────────────────────────
const SAMPLE_JOBS = [
  {
    id: 1, platform: "Upwork", score: 94,
    title: "Senior React Native Developer for FinTech MVP",
    budget: "$8,000–$15,000", posted: "14 min ago",
    client: { name: "StartupCo", country: "🇺🇸 USA", spent: "$45k+", rating: 4.9, hires: 12 },
    tags: ["React Native", "Node.js", "Stripe", "MVP"],
    snippet: "Looking for a senior RN dev to build our financial dashboard app. Must have experience with Plaid API integration and mobile payment flows...",
    reasons: ["Budget matches your Tier B range", "Client has $45k+ history — serious buyer", "React Native + Node — exact your stack", "First 3 applicants — posted 14 min ago"],
  },
  {
    id: 2, platform: "LinkedIn", score: 88,
    title: "CTO-for-Hire: SaaS Platform Architecture",
    budget: "$6,000/mo retainer", posted: "2 hrs ago",
    client: { name: "James Miller", country: "🇬🇧 UK", spent: "Series A", rating: null, hires: null },
    tags: ["MERN Stack", "AWS", "Technical Lead", "SaaS"],
    snippet: "We raised $2M seed. Need a fractional CTO to own our technical roadmap, hire engineers, and oversee delivery of v1. 3-month contract to start...",
    reasons: ["Funded startup — guaranteed budget", "Fractional CTO = your highest rate tier", "MERN stack — perfect fit", "Direct founder contact on LinkedIn"],
  },
  {
    id: 3, platform: "Wellfound", score: 81,
    title: "React Native Developer — Healthcare App",
    budget: "$10,000–$20,000", posted: "1 day ago",
    client: { name: "MediTrack Inc", country: "🇨🇦 Canada", spent: "YC W25", rating: null, hires: null },
    tags: ["React Native", "Firebase", "HIPAA", "Healthcare"],
    snippet: "YC-backed healthtech building patient tracking app. Need senior RN dev for 8-week sprint. Firebase backend already set up. HIPAA compliance experience preferred...",
    reasons: ["YC-backed — fast decisions, good budget", "Firebase already set up — faster delivery", "Healthcare = govt project relevance", "8-week scope — clean timeline"],
  },
];

const PROPOSAL_TEMPLATE = `Hi [Client Name],

I noticed you need [specific need from job] — I built something very similar for [relevant past project], and I know exactly what it takes to get this right.

Here's how I'd approach your project:

**Week 1–2:** Architecture setup, auth flow, and core screens
**Week 3–5:** Main feature development + API integration  
**Week 6–7:** Testing, performance optimization, App Store prep
**Week 8:** Launch support + handoff documentation

A few things that make me the right fit:
→ 7+ years React Native — I've shipped apps to 100k+ government users
→ MERN stack full-stack capability — I handle both ends
→ US LLC (DanielForge Technologies) — proper contract + USD invoicing

My fixed price for this scope: **$[price]** with 3 milestones so you only pay as we hit targets.

Can we jump on a 15-minute call this week to confirm scope?

Daniyal Naeem | DanielForge Technologies LLC`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16 }) => {
  const icons = {
    zap: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    target: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
    linkedin: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
    trending: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    copy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    send: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    refresh: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
    bar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    arrow: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    sparkle: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41 24 12 14.59 14.59 12 24 9.41 14.59 0 12 9.41 9.41Z" opacity="0.3"/><path d="M12 3L13.5 9.5 20 11 13.5 12.5 12 19 10.5 12.5 4 11 10.5 9.5Z"/></svg>,
  };
  return icons[name] || null;
};

// ─── Score ring ───────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const color = score >= 90 ? C.success : score >= 75 ? C.accent : C.warn;
  const r = 18, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
      <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke={C.border} strokeWidth="3"/>
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color }}>
        {score}
      </div>
    </div>
  );
};

// ─── Platform badge ───────────────────────────────────────────────────────────
const PlatformBadge = ({ platform }) => {
  const colors = { Upwork: [C.success, C.successDim], LinkedIn: [C.accent, C.accentDim], Wellfound: [C.purple, C.purpleDim] };
  const [fg, bg] = colors[platform] || [C.textMuted, C.border];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: bg, color: fg, letterSpacing: "0.05em" }}>
      {platform.toUpperCase()}
    </span>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ProposalAgent() {
  const [tab, setTab] = useState("jobs");
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposal, setProposal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stats] = useState({ sent: 23, replied: 7, won: 3, revenue: 18400 });
  const [customJob, setCustomJob] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const proposalRef = useRef(null);

  const generateProposal = async (job) => {
    setSelectedJob(job);
    setTab("proposal");
    setGenerating(true);
    setProposal("");

    const prompt = `You are Daniyal Naeem, founder of DanielForge Technologies (Delaware LLC), a senior React Native & MERN stack developer with 7+ years experience. You've built apps for KPK government (100k+ users) and Sofitel Abu Dhabi.

Write a winning, personalized Upwork/freelance proposal for this job posting:

Title: ${job.title}
Budget: ${job.budget}
Platform: ${job.platform}
Description: ${job.snippet}
Client: ${job.client.name} from ${job.client.country}
Tags: ${job.tags.join(", ")}

Rules for the proposal:
- Start with a HOOK referencing something specific from their job (not "Dear Sir")
- Show you understand their real problem, not just what they wrote
- Mention 1 specific relevant past project (govt app / Sofitel / Ropstam)
- Propose a 3-milestone payment structure 
- End with a low-commitment CTA (15-min call)
- Keep it under 200 words
- Sound like a confident senior dev, not desperate
- Mention DanielForge Technologies LLC for credibility
- Suggest a specific price within their budget range

Write the proposal now, no preamble:`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || PROPOSAL_TEMPLATE;
      setProposal(text);
    } catch {
      setProposal(PROPOSAL_TEMPLATE);
    }
    setGenerating(false);
  };

  const generateFromCustom = async () => {
    if (!customJob.trim()) return;
    const fakeJob = {
      id: 99, platform: "Custom", score: 85,
      title: "Custom Job", budget: "TBD", posted: "now",
      client: { name: "Client", country: "🌐 Global", spent: "Unknown" },
      tags: ["Custom"],
      snippet: customJob,
      reasons: ["Custom job analysis"],
    };
    setShowCustom(false);
    setCustomJob("");
    await generateProposal(fakeJob);
  };

  const copyProposal = () => {
    navigator.clipboard.writeText(proposal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const winRate = stats.sent ? Math.round((stats.won / stats.sent) * 100) : 0;
  const replyRate = stats.sent ? Math.round((stats.replied / stats.sent) * 100) : 0;

  return (
    <>
      <style>{fonts}{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .btn-primary { background: ${C.accent}; color: #fff; }
        .btn-primary:hover { background: #6B8FFF; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: ${C.textMuted}; border: 1px solid ${C.border}; }
        .btn-ghost:hover { background: ${C.surfaceHover}; color: ${C.text}; border-color: ${C.borderBright}; }
        .btn-success { background: ${C.successDim}; color: ${C.success}; border: 1px solid #1A4030; }
        .btn-success:hover { background: #0F3828; }
        .tag { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: ${C.accentDim}; color: ${C.accentText}; }
        .card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 12px; }
        .card:hover { border-color: ${C.borderBright}; }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes slideUp { from { opacity:0; transform: translateY(12px) } to { opacity:1; transform: translateY(0) } }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        .slide-up { animation: slideUp 0.3s ease; }
        textarea { background: ${C.surfaceHover}; border: 1px solid ${C.border}; color: ${C.text}; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.7; border-radius: 10px; padding: 14px; resize: vertical; width: 100%; outline: none; }
        textarea:focus { border-color: ${C.accent}; }
        textarea::placeholder { color: ${C.textDim}; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", minHeight: "100vh" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentDim, border: `1px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
              <Icon name="zap" size={18}/>
            </div>
            <div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.02em" }}>
                ProposalAgent
              </div>
              <div style={{ fontSize: 11, color: C.textMuted }}>DanielForge Technologies · AI Client Acquisition</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: C.successDim, borderRadius: 20, border: `1px solid ${C.success}30` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, animation: "pulse 2s infinite" }}/>
              <span style={{ fontSize: 11, color: C.success, fontWeight: 500 }}>3 new jobs matched</span>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Proposals sent", val: stats.sent, icon: "send", color: C.accent },
            { label: "Reply rate", val: `${replyRate}%`, icon: "mail", color: C.purple },
            { label: "Win rate", val: `${winRate}%`, icon: "target", color: C.success },
            { label: "Revenue won", val: `$${(stats.revenue/1000).toFixed(1)}k`, icon: "trending", color: C.teal },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
                </div>
                <div style={{ color: s.color, opacity: 0.6 }}><Icon name={s.icon} size={18}/></div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
          {[
            { id: "jobs", label: "Job Matches", icon: "target" },
            { id: "proposal", label: "Proposal Writer", icon: "sparkle" },
            { id: "followup", label: "Follow-up Sequences", icon: "clock" },
            { id: "analytics", label: "Win Analytics", icon: "bar" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 16px",
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
              color: tab === t.id ? C.text : C.textMuted,
              fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
              marginBottom: -1,
            }}>
              <span style={{ color: tab === t.id ? C.accent : C.textMuted }}><Icon name={t.icon} size={14}/></span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Job Matches ── */}
        {tab === "jobs" && (
          <div className="slide-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                AI found <span style={{ color: C.accent, fontWeight: 600 }}>3 high-fit jobs</span> in the last 2 hours across Upwork, LinkedIn & Wellfound
              </div>
              <button className="btn btn-ghost" onClick={() => setShowCustom(!showCustom)}>
                <Icon name="copy" size={13}/> Paste job manually
              </button>
            </div>

            {showCustom && (
              <div className="card slide-up" style={{ padding: 16, marginBottom: 16, borderColor: C.accent }}>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>Paste any job description below:</div>
                <textarea rows={4} placeholder="Paste Upwork job description, LinkedIn post, or client email here..." value={customJob} onChange={e => setCustomJob(e.target.value)}/>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn btn-primary" onClick={generateFromCustom}><Icon name="sparkle" size={13}/> Generate proposal</button>
                  <button className="btn btn-ghost" onClick={() => setShowCustom(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SAMPLE_JOBS.map((job, i) => (
                <div key={job.id} className="card slide-up" style={{ padding: "18px 20px", animationDelay: `${i * 0.08}s`, cursor: "pointer" }}
                  onClick={() => generateProposal(job)}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <ScoreRing score={job.score}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <PlatformBadge platform={job.platform}/>
                        <span style={{ fontFamily: "Syne", fontSize: 15, fontWeight: 600, color: C.text }}>{job.title}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 13, color: C.success, fontWeight: 500 }}>{job.budget}</span>
                        <span style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}><Icon name="clock" size={12}/>{job.posted}</span>
                        <span style={{ fontSize: 12, color: C.textMuted }}>{job.client.country} · {job.client.spent || job.client.name}</span>
                        {job.client.rating && <span style={{ fontSize: 12, color: C.warn, display: "flex", alignItems: "center", gap: 3 }}><Icon name="star" size={11}/>{job.client.rating}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10, lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{job.snippet}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                        {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                      <div style={{ background: C.bg, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: C.textDim, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 6 }}>WHY YOU SHOULD APPLY</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {job.reasons.map(r => (
                            <div key={r} style={{ fontSize: 12, color: C.textMuted, display: "flex", alignItems: "flex-start", gap: 6 }}>
                              <span style={{ color: C.success, marginTop: 1 }}><Icon name="check" size={11}/></span>{r}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary" onClick={e => { e.stopPropagation(); generateProposal(job); }}>
                          <Icon name="sparkle" size={13}/> Generate AI proposal
                        </button>
                        <button className="btn btn-ghost" onClick={e => e.stopPropagation()}>
                          <Icon name="linkedin" size={13}/> Research client
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: Proposal ── */}
        {tab === "proposal" && (
          <div className="slide-up">
            {!selectedJob ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
                <div style={{ fontFamily: "Syne", fontSize: 18, color: C.text, marginBottom: 8 }}>Select a job to generate a proposal</div>
                <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 20 }}>Go to Job Matches and click "Generate AI proposal" on any job</div>
                <button className="btn btn-primary" onClick={() => setTab("jobs")}><Icon name="target" size={13}/> Browse job matches</button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                  <ScoreRing score={selectedJob.score}/>
                  <div>
                    <div style={{ fontFamily: "Syne", fontSize: 14, fontWeight: 600, color: C.text }}>{selectedJob.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{selectedJob.platform} · {selectedJob.budget} · {selectedJob.client.country}</div>
                  </div>
                  <button className="btn btn-ghost" style={{ marginLeft: "auto", fontSize: 12 }} onClick={() => setTab("jobs")}>
                    ← Change job
                  </button>
                </div>

                {generating ? (
                  <div className="card" style={{ padding: 32, textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                      <div style={{ color: C.accent, animation: "pulse 1s infinite" }}><Icon name="sparkle" size={24}/></div>
                      <div style={{ fontFamily: "Syne", fontSize: 16, color: C.text }}>Generating personalized proposal...</div>
                    </div>
                    {["Researching client background", "Analyzing your best-fit projects", "Crafting personalized opening hook", "Building milestone structure", "Optimizing for reply rate"].map((step, i) => (
                      <div key={step} style={{ fontSize: 12, color: C.textMuted, marginBottom: 5, animation: `pulse 2s infinite`, animationDelay: `${i * 0.3}s`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent }}/>
                        {step}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: C.textMuted }}>AI-generated proposal · Edit before sending</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost" onClick={() => generateProposal(selectedJob)}>
                          <Icon name="refresh" size={13}/> Regenerate
                        </button>
                        <button className={`btn ${copied ? "btn-success" : "btn-primary"}`} onClick={copyProposal}>
                          {copied ? <><Icon name="check" size={13}/> Copied!</> : <><Icon name="copy" size={13}/> Copy proposal</>}
                        </button>
                      </div>
                    </div>
                    <textarea ref={proposalRef} rows={16} value={proposal} onChange={e => setProposal(e.target.value)}/>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
                      {[
                        { label: "Estimated read time", val: "45 sec", color: C.accent },
                        { label: "Word count", val: `${proposal.split(" ").length} words`, color: C.purple },
                        { label: "Win probability", val: "~68%", color: C.success },
                      ].map(m => (
                        <div key={m.label} style={{ background: C.surface, borderRadius: 8, padding: "10px 14px", textAlign: "center", border: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>{m.label}</div>
                          <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 700, color: m.color }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, padding: "12px 16px", background: C.accentDim, borderRadius: 10, border: `1px solid ${C.accent}30` }}>
                      <div style={{ fontSize: 12, color: C.accentText, fontWeight: 500, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                        <Icon name="zap" size={13}/> Follow-up sequence generated automatically
                      </div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>Day 3, Day 7, and Day 14 follow-ups queued in your sequence tracker. <button onClick={() => setTab("followup")} style={{ color: C.accent, background: "none", border: "none", cursor: "pointer", fontSize: 12, padding: 0 }}>View sequences →</button></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Follow-up ── */}
        {tab === "followup" && (
          <div className="slide-up">
            <div style={{ marginBottom: 16, fontSize: 13, color: C.textMuted }}>
              Automated follow-up sequences for <span style={{ color: C.accent }}>3 active proposals</span>
            </div>
            {[
              { job: "Senior React Native — FinTech MVP", sent: "2 days ago", status: "Awaiting reply", next: "Day 7 follow-up in 5 days", color: C.warn },
              { job: "CTO-for-Hire: SaaS Platform", sent: "4 hours ago", status: "Proposal viewed", next: "Day 3 follow-up in 2 days", color: C.accent },
              { job: "Healthcare React Native App", sent: "1 day ago", status: "Shortlisted", next: "Call scheduled — no follow-up needed", color: C.success },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: "16px 20px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ fontFamily: "Syne", fontSize: 14, fontWeight: 600, color: C.text }}>{item.job}</div>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: item.color + "20", color: item.color, fontWeight: 500 }}>{item.status}</span>
                </div>
                <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.textMuted, marginBottom: 12 }}>
                  <span>Sent: {item.sent}</span>
                  <span style={{ color: item.color }}>Next: {item.next}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }}><Icon name="mail" size={12}/> Preview follow-up</button>
                  <button className="btn btn-ghost" style={{ fontSize: 12 }}><Icon name="send" size={12}/> Send now</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: Analytics ── */}
        {tab === "analytics" && (
          <div className="slide-up">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontWeight: 500 }}>PROPOSALS BY PLATFORM</div>
                {[
                  { label: "Upwork", val: 14, pct: 61, color: C.success },
                  { label: "LinkedIn", val: 6, pct: 26, color: C.accent },
                  { label: "Wellfound", val: 3, pct: 13, color: C.purple },
                ].map(p => (
                  <div key={p.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: C.text }}>{p.label}</span>
                      <span style={{ color: C.textMuted }}>{p.val} sent · {p.pct}%</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${p.pct}%`, background: p.color, borderRadius: 3, transition: "width 1s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 16, fontWeight: 500 }}>WIN RATE BY BUDGET TIER</div>
                {[
                  { label: "Tier A ($2k–$5k)", rate: 22, color: C.teal },
                  { label: "Tier B ($5k–$15k)", rate: 18, color: C.accent },
                  { label: "Tier C ($15k–$50k)", rate: 8, color: C.purple },
                ].map(p => (
                  <div key={p.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: C.text }}>{p.label}</span>
                      <span style={{ color: p.color, fontWeight: 600 }}>{p.rate}% win rate</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                      <div style={{ height: "100%", width: `${p.rate * 4}%`, background: p.color, borderRadius: 3, transition: "width 1s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, fontWeight: 500 }}>AI INSIGHTS — WHAT'S WORKING</div>
              {[
                { icon: "check", text: "Proposals under 180 words have 2.4x higher reply rate than longer ones", color: C.success },
                { icon: "check", text: "Jobs posted under 2 hours ago have 3x higher win rate — apply faster", color: C.success },
                { icon: "check", text: "Mentioning government client experience increases Tier C shortlist rate by 40%", color: C.accent },
                { icon: "arrow", text: "Your Upwork profile views spike on Tuesday and Wednesday mornings (US ET)", color: C.warn },
              ].map((ins, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, padding: "10px 12px", background: C.bg, borderRadius: 8 }}>
                  <span style={{ color: ins.color, flexShrink: 0, marginTop: 1 }}><Icon name={ins.icon} size={14}/></span>
                  <span style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
