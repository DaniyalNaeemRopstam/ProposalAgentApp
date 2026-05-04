import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BtnVariant = "primary" | "ghost" | "success";

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  /** Optional leading icon slot */
  leftIcon?: ReactNode;
}

const base =
  "inline-flex items-center gap-1.5 rounded-lg border border-transparent px-4 py-2 font-sans text-[13px] font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50";

const variants: Record<BtnVariant, string> = {
  primary:
    "border-0 bg-accent text-white hover:-translate-y-px hover:bg-[#6B8FFF]",
  ghost:
    "border-border bg-transparent text-textMuted hover:border-borderBright hover:bg-surfaceHover hover:text-text",
  success:
    "border-[#1A4030] bg-successDim text-success hover:bg-[#0F3828]",
};

export function Btn({
  variant = "primary",
  className,
  children,
  leftIcon,
  type = "button",
  ...props
}: BtnProps) {
  return (
    <button type={type} className={cn(base, variants[variant], className)} {...props}>
      {leftIcon}
      {children}
    </button>
  );
}
