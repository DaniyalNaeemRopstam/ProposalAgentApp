import { cn } from "@/lib/cn";

/** Matches PIPELINE_STAGE_ORDER length in `usePipeline`. */
const PIPELINE_COLUMN_COUNT = 7;

function ColumnSkeleton() {
  return (
    <div className="flex min-h-[280px] w-[240px] shrink-0 flex-col rounded-xl border border-border bg-surface/90 sm:w-[268px]">
      <div className="border-b border-border px-3 py-2">
        <div
          className="mx-auto h-4 w-20 rounded bg-surfaceHover animate-pulse"
          style={{ animationDuration: "2s" }}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-surfaceHover animate-pulse"
            style={{ animationDuration: "2s", animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Kanban columns placeholder (one per pipeline stage). */
export function PipelineSkeleton() {
  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-4")}>
      {Array.from({ length: PIPELINE_COLUMN_COUNT }).map((_, i) => (
        <ColumnSkeleton key={i} />
      ))}
    </div>
  );
}
