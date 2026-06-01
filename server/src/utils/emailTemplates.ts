/** ProposalAgent onboarding / conversion emails — inline HTML, email-client safe. */

import { getAppWebBaseUrl } from "./appWebUrl";

const BG = "#07090F";
const CARD = "#0E1119";
const ACCENT = "#4F7CFF";
const TEXT = "#F0F2F8";
const MUTED = "#8B93B0";
const FONT = "Arial, Helvetica, sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ctaButton(label: string, href: string): string {
  const safeHref = encodeURI(href);
  const safeLabel = escapeHtml(label);
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px auto 8px;">
    <tr>
      <td style="border-radius:8px;background:${ACCENT}">
        <a href="${safeHref}"
           style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">
          ${safeLabel}
        </a>
      </td>
    </tr>
  </table>`;
}

function ghostLink(label: string, href: string): string {
  return `
  <p style="margin:16px 0 0;text-align:center;font-family:${FONT};font-size:14px;">
    <a href="${encodeURI(href)}" style="color:${ACCENT};text-decoration:none;">${escapeHtml(label)}</a>
  </p>`;
}

function shell(previewText: string, inner: string): string {
  const pre = escapeHtml(previewText);
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <title>ProposalAgent</title>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;">${pre}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"
               style="max-width:600px;width:100%;background:${CARD};border-radius:12px;border:1px solid #1E2330;">
          <tr><td style="padding:28px 28px 8px;font-family:${FONT};">${inner}</td></tr>
          <tr>
            <td style="padding:8px 28px 24px;text-align:center;font-family:${FONT};font-size:12px;color:${MUTED};">
              ProposalAgent · AI proposals in your voice
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeOnRegister(opts: { name: string }): { subject: string; html: string } {
  const base = getAppWebBaseUrl();
  const firstName = escapeHtml(opts.name.trim().split(/\s+/)[0] || opts.name.trim());
  const jobsUrl = `${base}/dashboard/jobs`;
  const subject = "Your ProposalAgent account is ready ⚡";
  const inner = `
    <p style="margin:0 0 16px;color:${TEXT};font-size:22px;line-height:1.3;font-weight:bold;">
      Welcome, ${firstName}!
    </p>
    <p style="margin:0 0 12px;color:${MUTED};font-size:15px;line-height:1.55;">
      Your account is live. You have <strong style="color:${TEXT};">3 free AI proposals</strong> to explore job matches and draft outreach in seconds.
    </p>
    <p style="margin:12px 0;color:${MUTED};font-size:14px;line-height:1.55;">
      <strong style="color:${TEXT};">Quick tip:</strong> paste any job description and watch AI draft in your tone — tweak and send when you&apos;re ready.
    </p>
    ${ctaButton("Generate your first proposal →", jobsUrl)}
  `;
  return { subject, html: shell("Your ProposalAgent account is ready", inner) };
}

export function firstProposalGenerated(opts: { name: string }): { subject: string; html: string } {
  const base = getAppWebBaseUrl();
  const firstName = escapeHtml(opts.name.trim().split(/\s+/)[0] || opts.name.trim());
  const subject = "How was your first AI proposal? 🎯";
  const inner = `
    <p style="margin:0 0 12px;color:${TEXT};font-size:19px;line-height:1.35;font-weight:bold;">
      Nice work, ${firstName} — you shipped your first proposal
    </p>
    <p style="margin:0 0 12px;color:${MUTED};font-size:15px;line-height:1.55;">
      You&apos;re picking up momentum. You still have <strong style="color:${TEXT};">2 proposals left</strong> on the free plan.
    </p>
    <p style="margin:0 0 8px;color:${TEXT};font-size:14px;line-height:1.5;font-weight:bold;">Tips that win replies</p>
    <ul style="margin:0;padding:0 0 0 20px;color:${MUTED};font-size:14px;line-height:1.6;">
      <li>Lead with one line tailored to their post or problem.</li>
      <li>Send within ~2 hours of the job posting when possible.</li>
      <li>Keep bullets skimmable; let your proof live in outcomes.</li>
    </ul>
    ${ctaButton("Generate another proposal →", `${base}/dashboard/jobs`)}
  `;
  return { subject, html: shell("Tips after your first proposal", inner) };
}

export function secondProposalFreeReminder(opts: { name: string }): { subject: string; html: string } {
  const base = getAppWebBaseUrl();
  const firstName = escapeHtml(opts.name.trim().split(/\s+/)[0] || opts.name.trim());
  const billing = `${base}/dashboard/settings`;
  const jobsUrl = `${base}/dashboard/jobs`;
  const subject = "1 free proposal remaining ⚠️";
  const inner = `
    <p style="margin:0 0 12px;color:${TEXT};font-size:19px;line-height:1.35;font-weight:bold;">
      ${firstName}, you&apos;ve used 2 of 3 free proposals
    </p>
    <p style="margin:0 0 14px;color:${MUTED};font-size:15px;line-height:1.55;">
      After your third free AI proposal, upgrading unlocks uninterrupted momentum — unlimited drafts, multi-platform sourcing, sequences, and analytics.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:14px 0;border-collapse:collapse;">
      <tr>
        <td style="width:48%;vertical-align:top;padding:14px;background:#07090F;border-radius:8px;border:1px solid #1E2330;">
          <p style="margin:0 0 8px;color:${TEXT};font-size:13px;font-weight:bold;">FREE</p>
          <ul style="margin:0;padding:0 0 0 16px;color:${MUTED};font-size:12px;line-height:1.5;">
            <li>3 proposals total</li>
            <li>Core Upwork workflows</li>
            <li>Upgrade to unlock the rest</li>
          </ul>
        </td>
        <td style="width:4%"></td>
        <td style="width:48%;vertical-align:top;padding:14px;background:${ACCENT}15;border-radius:8px;border:1px solid ${ACCENT}55;">
          <p style="margin:0 0 8px;color:${ACCENT};font-size:13px;font-weight:bold;">SOLO · $49/mo</p>
          <ul style="margin:0;padding:0 0 0 16px;color:${TEXT};font-size:12px;line-height:1.5;">
            <li>Unlimited proposals</li>
            <li>Upwork · LinkedIn · Wellfound · HN &amp; more</li>
            <li>Follow-ups · analytics · voice training</li>
          </ul>
        </td>
      </tr>
    </table>
    ${ctaButton("Upgrade to Solo — $49/mo →", billing)}
    ${ghostLink("Use your last free proposal →", jobsUrl)}
  `;
  return { subject, html: shell("One free AI proposal remaining", inner) };
}

export function freeLimitReached(opts: { name: string }): { subject: string; html: string } {
  const base = getAppWebBaseUrl();
  const firstName = escapeHtml(opts.name.trim().split(/\s+/)[0] || opts.name.trim());
  const billing = `${base}/dashboard/settings`;
  const subject = "You've used all 3 free proposals 🎉";
  const inner = `
    <p style="margin:0 0 12px;color:${TEXT};font-size:19px;line-height:1.35;font-weight:bold;">
      You mean business — 3 proposals down, ${firstName}
    </p>
    <p style="margin:0 0 14px;color:${MUTED};font-size:15px;line-height:1.55;">
      Unlock <strong style="color:${TEXT};">unlimited AI proposals</strong> on Solo plus every platform connector, automated follow-ups, analytics, and voice training.
    </p>
    <ul style="margin:0;padding:0 0 12px 20px;color:${MUTED};font-size:14px;line-height:1.55;">
      <li>Unlimited proposals &amp; scoring</li>
      <li>Upwork · LinkedIn · Wellfound · Hacker News pipelines</li>
      <li>Follow-up sequences that keep you top-of-inbox</li>
      <li>Win-rate analytics so you sharpen every send</li>
    </ul>
    ${ctaButton("Upgrade to Solo — $49/mo →", billing)}
    <p style="margin:14px 0 0;color:${MUTED};font-size:13px;line-height:1.5;text-align:center;">
      <strong style="color:${TEXT};">Limited time:</strong> use code <strong style="color:${ACCENT};">EARLYBIRD</strong> in Stripe checkout for <strong style="color:${TEXT};">20% off</strong> your first month (promo must be configured in Stripe).
    </p>
  `;
  return { subject, html: shell("Upgrade for unlimited proposals", inner) };
}

export function dayThreeNoProposal(opts: { name: string }): { subject: string; html: string } {
  const base = getAppWebBaseUrl();
  const firstName = escapeHtml(opts.name.trim().split(/\s+/)[0] || opts.name.trim());
  const jobsUrl = `${base}/dashboard/jobs`;
  const subject = "You have 3 free proposals waiting ⚡";
  const inner = `
    <p style="margin:0 0 12px;color:${TEXT};font-size:19px;line-height:1.35;font-weight:bold;">
      Your AI workspace is idle, ${firstName}
    </p>
    <p style="margin:0 0 12px;color:${MUTED};font-size:15px;line-height:1.55;">
      You signed up a few days ago but haven&apos;t tapped your <strong style="color:${TEXT};">three free ProposalAgent generations</strong> yet — it&apos;s intentionally fast.
    </p>
    <p style="margin:0 0 12px;color:${MUTED};font-size:14px;line-height:1.55;">
      Paste a job description from any board, tune the vibe, and you&apos;ll have a ready-to-send draft in under ten seconds.
    </p>
    ${ctaButton("Try it now →", jobsUrl)}
  `;
  return { subject, html: shell("Tap your remaining free proposals", inner) };
}
