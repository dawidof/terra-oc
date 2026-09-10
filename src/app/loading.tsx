export default function HomeLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-5 h-10 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-5 w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-9 flex gap-3">
            <div className="h-11 w-40 animate-pulse rounded-lg bg-muted" />
            <div className="h-11 w-40 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <div className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
          <div className="mt-5 space-y-3">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 border-t border-border py-8 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="size-4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="py-20">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl ring-1 ring-foreground/10">
              <div className="aspect-[16/10] animate-pulse rounded-t-xl bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
