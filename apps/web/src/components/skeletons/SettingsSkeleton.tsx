function Bar({ w }: { w: string }) {
  return (
    <div
      className={`h-9 rounded-lg bg-surfaceHover animate-pulse ${w}`}
      style={{ animationDuration: "2s" }}
    />
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Bar w="max-w-xs" />
      <div className="space-y-3">
        <Bar w="w-full" />
        <Bar w="w-full" />
        <Bar w="w-2/3" />
      </div>
    </div>
  );
}
