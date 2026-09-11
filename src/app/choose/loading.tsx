import { Skeleton } from "@/components/ui/skeleton";

export default function ChooseLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="hidden h-4 w-32 sm:block" />
      </div>
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </div>
  );
}
