import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Value / icon accent — MVP uses Syne headline in this color */
  accentColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  accentColor,
  className,
}: StatCardProps) {
  const valueStyle: CSSProperties | undefined = accentColor
    ? ({ color: accentColor } as CSSProperties)
    : undefined;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface px-4 py-[14px] transition-colors hover:border-borderBright",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="mb-1.5 text-[11px] text-textMuted">{label}</div>
          <div
            className="font-display text-2xl font-bold tracking-tight"
            style={valueStyle}
          >
            {value}
          </div>
        </div>
        {icon ? (
          <div className="opacity-60" style={accentColor ? { color: accentColor } : undefined}>
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}
