import { cn } from "@/lib/cn";

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md bg-surfaceHover animate-pulse", className)}
      style={{ animationDuration: "2s" }}
    />
  );
}

export function JobSkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex gap-3.5">
        <ShimmerBlock className="h-12 w-12 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <ShimmerBlock className="mb-3 h-4 w-3/4" />
          <div className="mb-4 flex gap-4">
            <ShimmerBlock className="h-3 w-20" />
            <ShimmerBlock className="h-3 w-16" />
          </div>
          <ShimmerBlock className="mb-4 h-3 w-full" />
          <div className="mb-4 flex gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-5 w-14 rounded-full" />
            ))}
          </div>
          <ShimmerBlock className="h-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/** Three stacked job card shimmers (pulse 1 → ~0.5 → 1 via Tailwind animate-pulse). */
export function JobSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <JobSkeletonCard key={i} />
      ))}
    </div>
  );
}
