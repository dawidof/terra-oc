import { eq, and, ilike, or, sql, desc, asc, SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  brands,
  carModels,
  modelVersions,
  trims,
  vehicleOffers,
  vehicleMedia,
  usedVehicleDetails,
  specificationGroups,
  specificationDefinitions,
  trimSpecificationValues,
} from "@/db/schema";

export type SortOption = "popular" | "price_asc" | "price_desc" | "newest" | "power" | "range";

export interface CatalogCar {
  trimId: string;
  trimName: string;
  trimSlug: string;
  powertrainType: string;
  drivetrain: string;
  motorPowerKw: number | null;
  enginePowerHp: number | null;
  batteryCapacityKwh: number | null;
  rangeKm: number | null;
  acceleration0100: number | null;
  basePrice: string | null;
  modelId: string;
  modelName: string;
  modelSlug: string;
  shortDescription: string | null;
  bodyType: string;
  featured: boolean;
  brandName: string;
  brandSlug: string;
  modelYear: number | null;
  condition: string | null;
  sourceCountry: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

export interface CatalogFilters {
  search?: string;
  brand?: string;
  bodyType?: string;
  powertrain?: string;
  drivetrain?: string;
  condition?: string;
  sourceCountry?: string;
  priceFrom?: number;
  priceTo?: number;
  yearFrom?: number;
  yearTo?: number;
  seats?: number;
}

const ITEMS_PER_PAGE = 12;

export async function getCatalogCars(
  filters: CatalogFilters,
  sort: SortOption = "popular",
  page: number = 1
) {
  const conditions: SQL[] = [eq(brands.active, true), eq(carModels.active, true), eq(trims.active, true)];

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(brands.name, searchTerm),
        ilike(carModels.name, searchTerm),
        ilike(carModels.shortDescription, searchTerm)
      )!
    );
  }

  if (filters.brand) {
    conditions.push(ilike(brands.slug, filters.brand));
  }
  if (filters.bodyType) {
    conditions.push(ilike(carModels.bodyType, filters.bodyType));
  }
  if (filters.powertrain) {
    conditions.push(ilike(trims.powertrainType, filters.powertrain));
  }
  if (filters.drivetrain) {
    conditions.push(ilike(trims.drivetrain, filters.drivetrain));
  }
  if (filters.condition) {
    conditions.push(ilike(vehicleOffers.condition, filters.condition));
  }
  if (filters.sourceCountry) {
    conditions.push(ilike(vehicleOffers.sourceCountry, filters.sourceCountry));
  }
  if (filters.priceFrom) {
    conditions.push(sql`${vehicleOffers.estimatedTotalUsd} >= ${String(filters.priceFrom)}`);
  }
  if (filters.priceTo) {
    conditions.push(sql`${vehicleOffers.estimatedTotalUsd} <= ${String(filters.priceTo)}`);
  }
  if (filters.yearFrom) {
    conditions.push(sql`${vehicleOffers.modelYear} >= ${filters.yearFrom}`);
  }
  if (filters.yearTo) {
    conditions.push(sql`${vehicleOffers.modelYear} <= ${filters.yearTo}`);
  }
  if (filters.seats) {
    conditions.push(eq(modelVersions.seats, filters.seats));
  }

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const whereClause = and(...conditions);

  let orderClause: SQL;
  switch (sort) {
    case "price_asc":
      orderClause = sql`"estimatedTotalUsd" ASC`;
      break;
    case "price_desc":
      orderClause = sql`"estimatedTotalUsd" DESC`;
      break;
    case "newest":
      orderClause = sql`"modelYear" DESC`;
      break;
    case "power":
      orderClause = sql`"motorPowerKw" DESC`;
      break;
    case "range":
      orderClause = sql`"rangeKm" DESC`;
      break;
    default:
      orderClause = sql`"featured" DESC, "trimId" ASC`;
  }

  const results = await db.execute(sql`
    WITH base AS (
      SELECT
        ${trims.id} as "trimId",
        ${trims.name} as "trimName",
        ${trims.slug} as "trimSlug",
        ${trims.powertrainType} as "powertrainType",
        ${trims.drivetrain} as "drivetrain",
        ${trims.motorPowerKw} as "motorPowerKw",
        ${trims.enginePowerHp} as "enginePowerHp",
        ${trims.batteryCapacityKwh} as "batteryCapacityKwh",
        ${trims.rangeKm} as "rangeKm",
        ${trims.acceleration0100} as "acceleration0100",
        ${trims.basePrice} as "basePrice",
        ${carModels.id} as "modelId",
        ${carModels.name} as "modelName",
        ${carModels.slug} as "modelSlug",
        ${carModels.shortDescription} as "shortDescription",
        ${carModels.bodyType} as "bodyType",
        ${carModels.featured} as "featured",
        ${brands.name} as "brandName",
        ${brands.slug} as "brandSlug",
        ${vehicleOffers.modelYear} as "modelYear",
        ${vehicleOffers.condition} as "condition",
        ${vehicleOffers.sourceCountry} as "sourceCountry",
        ${vehicleOffers.estimatedTotalUsd} as "estimatedTotalUsd",
        ${vehicleMedia.url} as "imageUrl"
      FROM ${trims}
      INNER JOIN ${modelVersions} ON ${trims.modelVersionId} = ${modelVersions.id}
      INNER JOIN ${carModels} ON ${modelVersions.carModelId} = ${carModels.id}
      INNER JOIN ${brands} ON ${carModels.brandId} = ${brands.id}
      INNER JOIN ${vehicleOffers} ON ${vehicleOffers.trimId} = ${trims.id}
      LEFT JOIN ${vehicleMedia} ON (${vehicleMedia.modelVersionId} = ${modelVersions.id} AND ${vehicleMedia.sortOrder} = ${0})
      WHERE ${whereClause}
    ),
    ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY "modelId" ORDER BY "estimatedTotalUsd" ASC) as rn
      FROM base
    )
    SELECT "trimId", "trimName", "trimSlug", "powertrainType", "drivetrain", "motorPowerKw", "enginePowerHp", "batteryCapacityKwh", "rangeKm", "acceleration0100", "basePrice", "modelId", "modelName", "modelSlug", "shortDescription", "bodyType", "featured", "brandName", "brandSlug", "modelYear", "condition", "sourceCountry", "estimatedTotalUsd", "imageUrl"
    FROM ranked
    WHERE rn = 1
    ORDER BY ${orderClause}
    LIMIT ${ITEMS_PER_PAGE}
    OFFSET ${offset}
  `);

  const countResult = await db.execute(sql`
    WITH base AS (
      SELECT DISTINCT ${carModels.id} as "modelId"
      FROM ${trims}
      INNER JOIN ${modelVersions} ON ${trims.modelVersionId} = ${modelVersions.id}
      INNER JOIN ${carModels} ON ${modelVersions.carModelId} = ${carModels.id}
      INNER JOIN ${brands} ON ${carModels.brandId} = ${brands.id}
      INNER JOIN ${vehicleOffers} ON ${vehicleOffers.trimId} = ${trims.id}
      WHERE ${whereClause}
    )
    SELECT COUNT(*)::int as count FROM base
  `);

  const total = (countResult[0]?.count as number) ?? 0;

  return {
    cars: results as unknown as CatalogCar[],
    total,
    page,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
  };
}

export async function getCarBySlug(slug: string) {
  const result = await db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      enginePowerHp: trims.enginePowerHp,
      engineDisplacementCc: trims.engineDisplacementCc,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      topSpeedKmh: trims.topSpeedKmh,
      basePrice: trims.basePrice,
      basePriceCurrency: trims.basePriceCurrency,
      modelVersionId: modelVersions.id,
      modelVersionName: modelVersions.name,
      modelYearFrom: modelVersions.modelYearFrom,
      modelYearTo: modelVersions.modelYearTo,
      seats: modelVersions.seats,
      doors: modelVersions.doors,
      modelId: carModels.id,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      description: carModels.description,
      shortDescription: carModels.shortDescription,
      bodyType: carModels.bodyType,
      brandId: brands.id,
      brandName: brands.name,
      brandSlug: brands.slug,
      brandCountry: brands.country,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .where(eq(trims.slug, slug))
    .limit(1);

  return result[0] || null;
}

export async function getCarOffers(trimId: string) {
  return db
    .select()
    .from(vehicleOffers)
    .where(eq(vehicleOffers.trimId, trimId));
}

export async function getUsedVehicleDetails(offerId: string) {
  return db
    .select()
    .from(usedVehicleDetails)
    .where(eq(usedVehicleDetails.offerId, offerId))
    .limit(1);
}

export async function getCarMedia(modelVersionId: string) {
  return db
    .select()
    .from(vehicleMedia)
    .where(eq(vehicleMedia.modelVersionId, modelVersionId))
    .orderBy(vehicleMedia.sortOrder);
}

export async function getTrimSpecs(trimId: string) {
  return db
    .select({
      groupName: specificationGroups.name,
      groupSlug: specificationGroups.slug,
      groupSortOrder: specificationGroups.sortOrder,
      specName: specificationDefinitions.name,
      specSlug: specificationDefinitions.slug,
      specDataType: specificationDefinitions.dataType,
      unit: specificationDefinitions.unit,
      valueText: trimSpecificationValues.valueText,
      valueNumber: trimSpecificationValues.valueNumber,
      valueBoolean: trimSpecificationValues.valueBoolean,
    })
    .from(trimSpecificationValues)
    .innerJoin(specificationDefinitions, eq(trimSpecificationValues.specificationDefinitionId, specificationDefinitions.id))
    .innerJoin(specificationGroups, eq(specificationDefinitions.groupId, specificationGroups.id))
    .where(eq(trimSpecificationValues.trimId, trimId))
    .orderBy(specificationGroups.sortOrder, specificationDefinitions.comparisonPriority);
}

export async function getAllTrims(modelVersionId: string) {
  return db
    .select({
      id: trims.id,
      name: trims.name,
      slug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      enginePowerHp: trims.enginePowerHp,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      basePrice: trims.basePrice,
    })
    .from(trims)
    .where(eq(trims.modelVersionId, modelVersionId))
    .orderBy(trims.basePrice);
}

export async function getFeaturedCars() {
  // Subquery: pick the cheapest trim per model version
  const cheapestPerModel = db
    .select({
      modelVersionId: trims.modelVersionId,
      minPrice: sql<string>`min(${trims.basePrice})::text`.as('min_price'),
    })
    .from(trims)
    .where(eq(trims.active, true))
    .groupBy(trims.modelVersionId)
    .as('cheapest_per_model');

  return db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      basePrice: trims.basePrice,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      imageUrl: vehicleMedia.url,
    })
    .from(trims)
    .innerJoin(cheapestPerModel, and(
      eq(trims.modelVersionId, cheapestPerModel.modelVersionId),
      eq(trims.basePrice, cheapestPerModel.minPrice),
    ))
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .leftJoin(vehicleMedia, eq(vehicleMedia.modelVersionId, modelVersions.id))
    .where(and(eq(carModels.featured, true), eq(brands.active, true), eq(trims.active, true)))
    .orderBy(asc(trims.basePrice))
    .limit(8);
}

export async function getFeaturedModels() {
  const cheapestPerModel = db
    .select({
      modelId: carModels.id,
      minPrice: sql<string>`min(${trims.basePrice})`.as('min_price'),
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .where(and(eq(carModels.featured, true), eq(brands.active, true), eq(trims.active, true)))
    .groupBy(carModels.id)
    .as('cheapest_per_model');

  return db
    .select({
      modelId: carModels.id,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      modelVersionId: modelVersions.id,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      basePrice: trims.basePrice,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      imageUrl: vehicleMedia.url,
    })
    .from(cheapestPerModel)
    .innerJoin(carModels, eq(cheapestPerModel.modelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(modelVersions, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(trims, and(
      eq(trims.modelVersionId, modelVersions.id),
      eq(trims.basePrice, cheapestPerModel.minPrice),
      eq(trims.active, true)
    ))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .leftJoin(vehicleMedia, and(eq(vehicleMedia.modelVersionId, modelVersions.id), eq(vehicleMedia.sortOrder, 0)))
    .orderBy(asc(cheapestPerModel.minPrice))
    .limit(8);
}

export async function getTrimsByModel(modelId: string) {
  return db
    .select({
      id: trims.id,
      name: trims.name,
      slug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      basePrice: trims.basePrice,
      modelVersionId: modelVersions.id,
      modelVersionName: modelVersions.name,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .where(and(eq(carModels.id, modelId), eq(trims.active, true)))
    .orderBy(trims.basePrice);
}

export async function getSimilarCars(
  bodyType: string | null,
  currentTrimId: string,
  minPrice: number,
  maxPrice: number
) {
  const priceMin = String(Math.floor(minPrice * 0.75));
  const priceMax = String(Math.ceil(maxPrice * 1.25));

  return db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      basePrice: trims.basePrice,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      imageUrl: vehicleMedia.url,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .leftJoin(vehicleMedia, and(eq(vehicleMedia.modelVersionId, modelVersions.id), eq(vehicleMedia.sortOrder, 0)))
    .where(
      and(
        eq(trims.active, true),
        sql`${trims.id} != ${currentTrimId}`,
        bodyType ? eq(carModels.bodyType, bodyType) : sql`true`,
        sql`${vehicleOffers.estimatedTotalUsd} >= ${priceMin}`,
        sql`${vehicleOffers.estimatedTotalUsd} <= ${priceMax}`
      )
    )
    .orderBy(sql`random()`)
    .limit(4);
}

export async function getAllBrands() {
  return db
    .select()
    .from(brands)
    .where(eq(brands.active, true))
    .orderBy(brands.sortOrder, brands.name);
}
