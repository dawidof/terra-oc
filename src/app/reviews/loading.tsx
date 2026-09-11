import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewsLoading() {
  return (
    <div className="container mx-auto px-4">
      <div className="py-16 text-center">
        <Skeleton className="mx-auto h-4 w-24" />
        <Skeleton className="mx-auto mt-3 h-10 w-48" />
        <Skeleton className="mx-auto mt-3 h-5 w-96 max-w-full" />
      </div>
      <div className="bg-muted py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-card p-6 shadow-soft">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-4 h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
