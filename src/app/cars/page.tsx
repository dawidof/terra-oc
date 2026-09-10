import { Suspense } from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getAllBrands, getCatalogCars } from "@/lib/queries";
import { FilterBar } from "@/components/filter-bar";
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Каталог автомобилей</h1>
          <p className="text-muted-foreground">
            {total} {totalItemsText(total)} доступно
          </p>
        </div>

        <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded-lg" />}>
          <FilterBar brands={brands} total={total} />
        </Suspense>

        {cars.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center text-4xl">
              🔍
            </div>
            <h2 className="mb-2 text-xl font-semibold">Автомобили не найдены</h2>
            <p className="text-muted-foreground">Попробуйте изменить параметры поиска или расширить фильтры</p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cars.map((car: CatalogCar) => (
                <a
                  key={car.trimId}
                  href={`/cars/${car.trimSlug}`}
                  className="block transition-transform hover:-translate-y-0.5"
                >
                  <CarCardPlaceholder car={car} />
                </a>
              ))}
            </div>

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
          </>
        )}
      </div>
    </div>
  );
}

interface CatalogCar {
  trimId: string;
  trimName: string;
  trimSlug: string;
  brandName: string;
  modelName: string;
  powertrainType: string | null;
  drivetrain: string | null;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

function CarCardPlaceholder({ car }: { car: CatalogCar }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-soft">
      <div className="relative aspect-[4/3] bg-gray-100">
        {car.imageUrl ? (
          <img
            src={car.imageUrl}
            alt={`${car.brandName} ${car.modelName}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">Фото скоро</div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div className="text-sm text-muted-foreground">{car.brandName}</div>
        <h3 className="text-lg font-semibold">{car.modelName} <span className="font-normal text-muted-foreground">{car.trimName}</span></h3>
        <div className="flex gap-2 text-sm text-muted-foreground">
          {car.powertrainType && <span>{car.powertrainType}</span>}
          {car.drivetrain && <span>{car.drivetrain}</span>}
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground">от</div>
            <div className="text-xl font-bold">{car.basePrice ? `$${Number(car.basePrice).toLocaleString()}` : "Цена уточняется"}</div>
          </div>
          {car.estimatedTotalUsd && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">под ключ</div>
              <div className="text-sm font-medium text-emerald-600">{`$${Number(car.estimatedTotalUsd).toLocaleString()}`}</div>
            </div>
          )}
        </div>
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
