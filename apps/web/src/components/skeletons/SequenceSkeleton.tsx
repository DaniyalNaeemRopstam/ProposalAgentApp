import { cn } from "@/lib/cn";

function Row() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4">
      <div
        className="h-10 w-10 shrink-0 rounded-lg bg-surfaceHover animate-pulse"
        style={{ animationDuration: "2s" }}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div
          className="h-4 w-1/2 rounded bg-surfaceHover animate-pulse"
          style={{ animationDuration: "2s" }}
        />
        <div
          className="h-3 w-full rounded bg-surfaceHover animate-pulse"
          style={{ animationDuration: "2s" }}
        />
      </div>
      <div
        className="h-8 w-24 shrink-0 rounded-lg bg-surfaceHover animate-pulse"
        style={{ animationDuration: "2s" }}
      />
    </div>
  );
}

export function SequenceSkeleton() {
  return (
    <div className={cn("flex flex-col gap-3")}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  );
}
