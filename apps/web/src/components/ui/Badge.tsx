import { cn } from "@/lib/cn";

export type Platform = "Upwork" | "LinkedIn" | "Wellfound" | "Direct";

export interface BadgeProps {
  platform: Platform;
  className?: string;
}

const platformStyles: Record<Platform, string> = {
  Upwork:
    "bg-successDim text-successText ring-1 ring-inset ring-success/35 border-success/20",
  LinkedIn:
    "bg-accentDim text-accentText ring-1 ring-inset ring-accent/40 border-accent/25",
  Wellfound:
    "bg-purpleDim text-purple ring-1 ring-inset ring-purple/40 border-purple/25",
  Direct: "bg-tealDim text-teal ring-1 ring-inset ring-teal/35 border-teal/20",
};

export function Badge({ platform, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        platformStyles[platform],
        className
      )}
    >
      {platform}
    </span>
  );
}
