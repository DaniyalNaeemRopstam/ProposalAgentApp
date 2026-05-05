import type { Config } from "tailwindcss";
import { CX as C } from "./src/styles/theme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: C.bg,
        surface: C.surface,
        surfaceHigh: C.surfaceHigh,
        surfaceHover: C.surfaceHover,
        border: C.border,
        borderBright: C.borderBright,
        accent: C.accent,
        accentDim: C.accentDim,
        accentGlow: C.accentGlow,
        accentText: C.accentText,
        success: C.success,
        successDim: C.successDim,
        successText: C.successText,
        warn: C.warn,
        warnDim: C.warnDim,
        warnText: C.warnText,
        danger: C.danger,
        dangerDim: C.dangerDim,
        purple: C.purple,
        purpleDim: C.purpleDim,
        teal: C.teal,
        tealDim: C.tealDim,
        text: C.text,
        textSub: C.textSub,
        textMuted: C.textMuted,
        textDim: C.textDim,
      },
      fontFamily: {
        display: ["var(--font-syne)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: `0 0 24px ${C.accentGlow}, 0 0 48px ${C.accentGlow}`,
        "glow-sm": `0 0 12px ${C.accentGlow}`,
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: `0 0 20px ${C.accentGlow}` },
          "50%": { boxShadow: `0 0 32px ${C.accentGlow}, 0 0 48px ${C.accentGlow}` },
        },
        heroFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.45s ease-out forwards",
        pulse: "pulse 2s ease-in-out infinite",
        spin: "spin 0.85s linear infinite",
        slideIn: "slideIn 0.4s ease-out forwards",
        slideUp: "slideUp 0.3s ease forwards",
        glow: "glow 2.2s ease-in-out infinite",
        heroFloat: "heroFloat 5.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
