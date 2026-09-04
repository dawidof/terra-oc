export default function CarsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="mb-6 h-24 animate-pulse rounded-lg bg-gray-100" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="mb-3 h-48 animate-pulse rounded bg-gray-200" />
            <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mb-2 h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
