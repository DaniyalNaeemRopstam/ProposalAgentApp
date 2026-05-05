export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-border bg-surface p-4"
          >
            <div
              className="mb-2 h-3 w-1/2 rounded bg-surfaceHover animate-pulse"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="h-8 w-16 rounded bg-surfaceHover animate-pulse"
              style={{ animationDuration: "2s" }}
            />
          </div>
        ))}
      </div>
      <div
        className="h-48 rounded-xl border border-border bg-surface p-4 animate-pulse"
        style={{ animationDuration: "2s" }}
      >
        <div className="h-full w-full rounded-lg bg-surfaceHover" />
      </div>
    </div>
  );
}
