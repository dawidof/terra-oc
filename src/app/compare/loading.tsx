import { Skeleton } from "@/components/ui/skeleton";

export default function CompareLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <Skeleton className="mt-6 h-12 w-full rounded-lg" />
      <div className="mt-8 grid grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            {[...Array(6)].map((_, j) => (
              <div key={j} className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
