import { Suspense } from "react";
import Link from "next/link";
import { getCatalogCars, getAllBrands } from "@/lib/queries";
import { CarCard } from "@/components/car-card";
import { FilterBar } from "@/components/filter-bar";
import type { SortOption, CatalogFilters } from "@/lib/queries";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export const metadata = {
  title: "Каталог автомобилей — TerraAuto",
  description: "Автомобили из Китая, Кореи, США и Дубая. Электромобили, гибриды, бензиновые автомобили.",
};

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const brands = await getAllBrands();

  const filters: CatalogFilters = {
    search: params.search,
    brand: params.brand,
    bodyType: params.bodyType,
    powertrain: params.powertrain,
    drivetrain: params.drivetrain,
    condition: params.condition,
    sourceCountry: params.sourceCountry,
    priceFrom: params.priceFrom ? Number(params.priceFrom) : undefined,
    priceTo: params.priceTo ? Number(params.priceTo) : undefined,
    yearFrom: params.yearFrom ? Number(params.yearFrom) : undefined,
    yearTo: params.yearTo ? Number(params.yearTo) : undefined,
    seats: params.seats ? Number(params.seats) : undefined,
  };

  const sort = (params.sort as SortOption) || "popular";
  const page = params.page ? Number(params.page) : 1;

  const { cars, total, totalPages } = await getCatalogCars(filters, sort, page);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Каталог автомобилей</h1>
          <p className="text-muted-foreground">
            {total} {totalItemsText(total)} доступно
          </p>
        </div>

        <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded-lg" />}>
          <FilterBar brands={brands} />
        </Suspense>

        {cars.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="mb-2 text-xl font-semibold">Автомобили не найдены</h2>
            <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cars.map((car) => (
              <CarCard
                key={car.trimId}
                brandName={car.brandName}
                brandSlug={car.brandSlug}
                modelName={car.modelName}
                modelSlug={car.modelSlug}
                trimName={car.trimName}
                trimSlug={car.trimSlug}
                powertrainType={car.powertrainType}
                drivetrain={car.drivetrain}
                motorPowerKw={car.motorPowerKw}
                enginePowerHp={car.enginePowerHp}
                rangeKm={car.rangeKm}
                basePrice={car.basePrice}
                estimatedTotalUsd={car.estimatedTotalUsd}
                imageUrl={car.imageUrl}
                modelYear={car.modelYear}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/cars?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                Назад
              </Link>
            )}
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {page} из {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/cars?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                Далее
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function totalItemsText(n: number): string {
  const lastDigit = n % 10;
  const lastTwoDigits = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "автомобилей";
  if (lastDigit === 1) return "автомобиль";
  if (lastDigit >= 2 && lastDigit <= 4) return "автомобиля";
  return "автомобилей";
}
