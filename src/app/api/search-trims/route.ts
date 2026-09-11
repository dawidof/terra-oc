import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { trims, modelVersions, carModels, brands, vehicleMedia } from "@/db/schema";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const revalidate = 120;

const PopularSlugs = [
  "byd-atto3-comfort",
  "zeekr-7x-7x-103kw-awd-ultra",
  "byd-seal-design",
  "changan-cs55-plus-flagship",
  "byd-dolphin-comfort",
  "tesla-modely-lr",
];

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
        powertrainType: trims.powertrainType,
        imageUrl: vehicleMedia.url,
      })
      .from(trims)
      .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
      .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
      .innerJoin(brands, eq(carModels.brandId, brands.id))
      .leftJoin(vehicleMedia, and(
        eq(vehicleMedia.modelVersionId, modelVersions.id),
        eq(vehicleMedia.type, "exterior"),
      ))
      .where(and(
        eq(trims.active, true),
        sql`${trims.slug} IN ${PopularSlugs}`,
      ))
      .orderBy(vehicleMedia.sortOrder)
      .limit(6);

    return NextResponse.json({ trims: results });
  }

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
    .orderBy(vehicleMedia.sortOrder)
    .limit(10);

  return NextResponse.json({ trims: results });
}
