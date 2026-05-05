// ProposalAgent_MVP.jsx design tokens - exact colors
export const colors = {
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
  /** Readable on warnDim banner */
  warnText: "#FBBF24",
  danger: "#F56060",
  text: "#F0F2F8",
  textMuted: "#6B7394",
  textDim: "#3A4060",
  purple: "#A78BFA",
  purpleDim: "#2D1F5A",
  teal: "#2DD4BF",
  tealDim: "#0D2E2A",
  /** iOS shadow / elevation tint */
  shadow: "#000000",
  /** Modal and sheet backdrops */
  overlay: "rgba(0, 0, 0, 0.55)",
  overlayMuted: "rgba(0, 0, 0, 0.5)",
} as const;

export type ColorKey = keyof typeof colors;