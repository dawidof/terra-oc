import { Skeleton } from "@/components/ui/skeleton";

export default function CalculatorLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-10 w-3/4" />
        <Skeleton className="mt-3 h-5 w-full" />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <Skeleton className="mt-8 h-12 w-48 rounded-lg" />
        <Skeleton className="mt-8 h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}
