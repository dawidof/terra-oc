export function LeadFormSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-xl border bg-card p-6">
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="h-12 w-full rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

export function CalculatorSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-9 w-64 rounded bg-muted animate-pulse" />
        <div className="h-5 w-96 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border bg-card p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
            </div>
          ))}
          <div className="h-12 w-full rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-64 rounded-xl border bg-card p-6">
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
