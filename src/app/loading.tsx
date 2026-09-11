import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6">
      <div className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
        <div className="flex flex-col justify-center lg:col-span-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-5 h-10 w-3/4" />
          <Skeleton className="mt-6 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <div className="mt-9 flex gap-3">
            <Skeleton className="h-11 w-40 rounded-lg" />
            <Skeleton className="h-11 w-40 rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <Skeleton className="aspect-[16/10] rounded-xl" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 border-t border-border py-8 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="size-4" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="py-20">
        <Skeleton className="h-8 w-48" />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl ring-1 ring-foreground/10">
              <Skeleton className="aspect-[16/10] rounded-t-xl" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
