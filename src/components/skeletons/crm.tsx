export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-6 w-20 rounded bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="h-9 w-48 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="mt-2 h-8 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 h-6 w-40 rounded bg-muted animate-pulse" />
        <TableSkeleton rows={5} />
      </div>
    </div>
  );
}
