import { NextRequest, NextResponse } from "next/server";
import { getCatalogCars, type SortOption } from "@/lib/queries";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`catalog-api:${ip}`, { windowMs: 60_000, maxRequests: 60 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const brand = searchParams.get("brand") || undefined;
  const bodyType = searchParams.get("bodyType") || undefined;
  const powertrain = searchParams.get("powertrain") || undefined;
  const drivetrain = searchParams.get("drivetrain") || undefined;
  const condition = searchParams.get("condition") || undefined;
  const sourceCountry = searchParams.get("sourceCountry") || undefined;
  const priceFrom = searchParams.get("priceFrom") ? Number(searchParams.get("priceFrom")) : undefined;
  const priceTo = searchParams.get("priceTo") ? Number(searchParams.get("priceTo")) : undefined;
  const yearFrom = searchParams.get("yearFrom") ? Number(searchParams.get("yearFrom")) : undefined;
  const yearTo = searchParams.get("yearTo") ? Number(searchParams.get("yearTo")) : undefined;
  const seats = searchParams.get("seats") ? Number(searchParams.get("seats")) : undefined;
  const sort = (searchParams.get("sort") as SortOption) || "popular";
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;

  const { cars, total, totalPages } = await getCatalogCars(
    { search, brand, bodyType, powertrain, drivetrain, condition, sourceCountry, priceFrom, priceTo, yearFrom, yearTo, seats },
    sort,
    page
  );

  return NextResponse.json({
    cars,
    total,
    page,
    totalPages,
  });
}

export async function HEAD() {
  return NextResponse.json({ cached: true });
}
