import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trims, modelVersions, carModels, brands, vehicleMedia } from "@/db/schema";
import { eq, and, or, ilike, asc } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getPopularTrimsForCalculator } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`search-trims:${ip}`, { windowMs: 60_000, maxRequests: 30 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const popular = searchParams.get("popular") === "true";

  if (popular) {
    const trimsList = await getPopularTrimsForCalculator();
    return NextResponse.json({ trims: trimsList });
  }

  if (q.length < 2) {
    return NextResponse.json({ trims: [] });
  }

  const searchTerm = `%${q}%`;

  const results = await db
    .selectDistinctOn([carModels.id], {
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      basePrice: trims.basePrice,
      basePriceCurrency: trims.basePriceCurrency,
      powertrainType: trims.powertrainType,
      engineDisplacementCc: trims.engineDisplacementCc,
      motorPowerKw: trims.motorPowerKw,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      imageUrl: vehicleMedia.url,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .leftJoin(vehicleMedia, and(
      eq(vehicleMedia.modelVersionId, modelVersions.id),
      eq(vehicleMedia.type, "exterior"),
      eq(vehicleMedia.sortOrder, 0)
    ))
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
    .orderBy(asc(carModels.id), asc(trims.basePrice))
    .limit(10);

  return NextResponse.json({ trims: results });
}
