import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds accent hover glow (border + shadow). */
  hoverGlow?: boolean;
}

export function Card({ hoverGlow = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 text-text shadow-none transition-[box-shadow,border-color,background-color] duration-200",
        hoverGlow &&
          "hover:border-accent/50 hover:bg-surfaceHigh hover:shadow-glow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
