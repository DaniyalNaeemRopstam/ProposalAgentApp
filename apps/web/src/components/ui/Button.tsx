import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "ghost" | "success" | "danger" | "purple";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-text shadow-glow-sm hover:bg-accentText/90 border border-transparent focus-visible:ring-2 focus-visible:ring-accentText/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  ghost:
    "bg-transparent text-textSub border border-borderBright hover:bg-surfaceHover hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  success:
    "bg-success text-bg font-medium border border-successText/30 hover:bg-successText/90 focus-visible:ring-2 focus-visible:ring-successText/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  danger:
    "bg-dangerDim text-danger border border-danger/40 hover:bg-danger/20 hover:border-danger focus-visible:ring-2 focus-visible:ring-danger/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
  purple:
    "bg-purpleDim text-purple border border-purple/35 hover:bg-purple/25 hover:border-purple focus-visible:ring-2 focus-visible:ring-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, type = "button", disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-45",
        variantClass[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
