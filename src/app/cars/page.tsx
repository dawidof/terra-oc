import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getAllBrands, getCatalogCars } from "@/lib/queries";
import { CarCard } from "@/components/car-card";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import type { SortOption, CatalogFilters } from "@/lib/queries";

export const revalidate = 60;

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const brand = params.brand ? ` — ${params.brand}` : "";
  return {
    title: `Каталог автомобилей${brand}`,
    description: "Автомобили из Китая, Кореи, США и Дубая. Электромобили, гибриды, бензиновые автомобили.",
  };
}

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

  const { cars, total, totalPages } = await getCatalogCars(
    {
      search: filters.search,
      brand: filters.brand,
      bodyType: filters.bodyType,
      powertrain: filters.powertrain,
      drivetrain: filters.drivetrain,
      condition: filters.condition,
      sourceCountry: filters.sourceCountry,
      priceFrom: filters.priceFrom,
      priceTo: filters.priceTo,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      seats: filters.seats,
    },
    sort,
    page
  );

  return (
    <Section padding="tight">
      <PageHeader
        eyebrow="Каталог"
        title="Каталог автомобилей"
        description={`${total} ${totalItemsText(total)} доступно`}
        align="left"
        size="xl"
      />

      <div className="mt-8">
        <Suspense
          fallback={<div className="h-24 animate-pulse rounded-lg bg-muted-section" />}
        >
          <FilterBar brands={brands} total={total} />
        </Suspense>
      </div>

      {cars.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-brand-muted text-4xl">
            🔍
          </div>
          <h2 className="mb-2 text-xl font-bold tracking-tight">
            Автомобили не найдены
          </h2>
          <p className="text-muted-foreground">
            Попробуйте изменить параметры поиска или расширить фильтры
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link
                  href={`/cars?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold shadow-soft transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
                >
                  Назад
                </Link>
              )}
              <span className="flex items-center px-2 text-sm tabular-nums text-muted-foreground">
                {page} из {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/cars?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold shadow-soft transition-colors hover:border-brand hover:bg-brand hover:text-brand-foreground"
                >
                  Далее
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </Section>
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
