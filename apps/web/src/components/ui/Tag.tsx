import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/** MVP `.tag`: 11px, pill, accentDim / accentText */
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Tag({ className, children, ...props }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-[20px] bg-accentDim px-[10px] py-[3px] text-[11px] font-medium text-accentText",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
