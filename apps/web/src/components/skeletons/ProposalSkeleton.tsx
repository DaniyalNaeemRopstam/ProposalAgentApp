import { cn } from "@/lib/cn";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-surfaceHover animate-pulse", className)} />;
}

export function ProposalSkeleton() {
  return (
    <div className="space-y-3">
      <Shimmer className="h-12 w-full max-w-xl rounded-[10px]" />
      <div className="rounded-[10px] border border-border bg-surface p-3">
        <Shimmer className="mb-3 h-3 w-2/5" />
        <Shimmer className="mb-3 h-[200px] w-full rounded-[10px]" />
        <div className="grid grid-cols-3 gap-2">
          <Shimmer className="h-16 rounded-lg" />
          <Shimmer className="h-16 rounded-lg" />
          <Shimmer className="h-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
