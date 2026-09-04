import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trims, modelVersions, carModels, brands, vehicleOffers } from "@/db/schema";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`search-trims:${ip}`, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ trims: [] });
  }

  const searchTerm = `%${q}%`;

  const results = await db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      basePrice: trims.basePrice,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .where(
      and(
        eq(trims.active, true),
        or(
          ilike(brands.name, searchTerm),
          ilike(carModels.name, searchTerm),
          ilike(trims.name, searchTerm)
        )
      )
    )
    .limit(10);

  return NextResponse.json({ trims: results });
}
