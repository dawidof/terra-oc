import { CarGridSkeleton } from "./car-card";

export function CatalogSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-4">
        <div className="h-9 w-48 rounded bg-muted animate-pulse" />
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 flex-1 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>

      <CarGridSkeleton />
    </div>
  );
}
