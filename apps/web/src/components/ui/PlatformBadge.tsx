import type { CSSProperties } from "react";
import { C } from "@/styles/theme";
import { cn } from "@/lib/cn";

/** MVP foreground + background pairing per platform label */
function colorsFor(platform: string): { fg: string; bg: string } {
  const map: Record<string, [string, string]> = {
    Upwork: [C.success, C.successDim],
    LinkedIn: [C.accent, C.accentDim],
    Wellfound: [C.purple, C.purpleDim],
    Custom: [C.accentText, C.accentDim],
  };
  const pair = map[platform] ?? ([C.textMuted, C.border] as [string, string]);
  return { fg: pair[0], bg: pair[1] };
}

export interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const { fg, bg } = colorsFor(platform);
  const style: CSSProperties = {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    background: bg,
    color: fg,
    letterSpacing: "0.05em",
  };

  return (
    <span className={cn("inline-flex", className)} style={style}>
      {platform.toUpperCase()}
    </span>
  );
}
