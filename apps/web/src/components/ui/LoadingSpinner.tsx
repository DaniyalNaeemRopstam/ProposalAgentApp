import { cn } from "@/lib/cn";

export interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  /** Accessible label for screen readers */
  label?: string;
}

export function LoadingSpinner({ size = 28, className, label = "Loading" }: LoadingSpinnerProps) {
  const border = Math.max(2, Math.round(size / 9));

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn("inline-block shrink-0 rounded-full border-solid animate-spin", className)}
      style={{
        width: size,
        height: size,
        borderWidth: border,
        borderColor: "var(--color-border-bright)",
        borderTopColor: "var(--color-accent)",
      }}
    />
  );
}
