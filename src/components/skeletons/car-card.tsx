export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-20 rounded bg-muted animate-pulse" />
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex justify-between pt-2">
          <div className="space-y-1">
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            <div className="h-6 w-20 rounded bg-muted animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-3 w-12 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CarGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <CarCardSkeleton key={i} />
      ))}
    </div>
  );
}
