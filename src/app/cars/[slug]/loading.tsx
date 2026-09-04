export default function CarDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 h-4 w-32 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-lg bg-gray-200" />
        <div>
          <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="mb-6 h-6 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="mb-4 h-10 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
