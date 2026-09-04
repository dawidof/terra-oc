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

  let orderBy: SQL;
  switch (sort) {
    case "price_asc":
      orderBy = asc(vehicleOffers.estimatedTotalUsd);
      break;
    case "price_desc":
      orderBy = desc(vehicleOffers.estimatedTotalUsd);
      break;
    case "newest":
      orderBy = desc(vehicleOffers.createdAt);
      break;
    case "power":
      orderBy = desc(trims.motorPowerKw);
      break;
    case "range":
      orderBy = desc(trims.rangeKm);
      break;
    default:
      orderBy = desc(carModels.featured);
  }

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const results = await db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      enginePowerHp: trims.enginePowerHp,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      basePrice: trims.basePrice,
      modelId: carModels.id,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      shortDescription: carModels.shortDescription,
      bodyType: carModels.bodyType,
      featured: carModels.featured,
      brandName: brands.name,
      brandSlug: brands.slug,
      modelYear: vehicleOffers.modelYear,
      condition: vehicleOffers.condition,
      sourceCountry: vehicleOffers.sourceCountry,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      imageUrl: vehicleMedia.url,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .leftJoin(vehicleMedia, eq(vehicleMedia.modelVersionId, modelVersions.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .where(and(...conditions));

  const total = countResult[0]?.count ?? 0;

  return {
    cars: results,
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
    .leftJoin(vehicleMedia, eq(vehicleMedia.modelVersionId, modelVersions.id))
    .where(and(eq(carModels.featured, true), eq(brands.active, true), eq(trims.active, true)))
    .orderBy(asc(trims.basePrice))
    .limit(8);
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
    .leftJoin(vehicleMedia, eq(vehicleMedia.modelVersionId, modelVersions.id))
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
