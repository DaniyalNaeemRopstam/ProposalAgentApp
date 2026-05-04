import { cn } from "@/lib/cn";

export type StatusTone = "success" | "warn" | "danger" | "accent" | "neutral";

export interface StatusDotProps {
  tone?: StatusTone;
  label: string;
  className?: string;
}

const toneDot: Record<StatusTone, string> = {
  success: "bg-success shadow-[0_0_10px_rgba(16,212,122,0.45)]",
  warn: "bg-warn shadow-[0_0_10px_rgba(245,166,35,0.4)]",
  danger: "bg-danger shadow-[0_0_10px_rgba(255,87,87,0.45)]",
  accent: "bg-accent shadow-[0_0_10px_rgba(79,124,255,0.45)]",
  neutral: "bg-textMuted shadow-none",
};

export function StatusDot({ tone = "neutral", label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-textSub", className)}>
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-35",
            toneDot[tone]
          )}
        />
        <span className={cn("relative h-2.5 w-2.5 rounded-full", toneDot[tone])} />
      </span>
      <span className="text-text">{label}</span>
    </span>
  );
}
