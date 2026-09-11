import { Skeleton } from "@/components/ui/skeleton";

export default function CarDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-4 h-4 w-32" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-lg" />
        <div>
          <Skeleton className="mb-4 h-8 w-3/4" />
          <Skeleton className="mb-6 h-6 w-1/2" />
          <Skeleton className="mb-4 h-10 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
