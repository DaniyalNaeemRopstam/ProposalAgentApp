/**
 * ProposalAgent_MVP.jsx `C` object — canonical design tokens (exact hex values).
 */
export const C = {
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
} as const;

/** Compatibility aliases for Tailwind / older components — not part of MVP `C`. */
export const CX = {
  ...C,
  surfaceHigh: C.surface as string,
  accentGlow: "rgba(79,124,255,0.18)",
  successText: "#4DEBA0",
  warnText: "#FFD080",
  dangerDim: "#2A1212",
  textSub: C.textMuted,
} as const;
