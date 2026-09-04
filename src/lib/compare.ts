import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  trims,
  modelVersions,
  carModels,
  brands,
  vehicleOffers,
  vehicleMedia,
  specificationGroups,
  specificationDefinitions,
  trimSpecificationValues,
} from "@/db/schema";

export interface ComparisonRow {
  specName: string;
  specSlug: string;
  groupName: string;
  unit: string | null;
  values: (string | null)[];
}

export interface ComparisonVehicle {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  enginePowerHp: number | null;
  batteryCapacityKwh: string | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

export async function getComparisonVehicle(trimSlug: string): Promise<ComparisonVehicle | null> {
  const result = await db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      enginePowerHp: trims.enginePowerHp,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      basePrice: trims.basePrice,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      imageUrl: vehicleMedia.url,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .leftJoin(vehicleMedia, eq(vehicleMedia.modelVersionId, modelVersions.id))
    .where(eq(trims.slug, trimSlug))
    .limit(1);

  return result[0] || null;
}

export async function getComparisonSpecs(trimIds: string[]): Promise<ComparisonRow[]> {
  if (trimIds.length === 0) return [];

  // Get all spec definitions
  const allSpecs = await db
    .select({
      specId: specificationDefinitions.id,
      specName: specificationDefinitions.name,
      specSlug: specificationDefinitions.slug,
      groupName: specificationGroups.name,
      unit: specificationDefinitions.unit,
      comparisonPriority: specificationDefinitions.comparisonPriority,
      groupSortOrder: specificationGroups.sortOrder,
    })
    .from(specificationDefinitions)
    .innerJoin(specificationGroups, eq(specificationDefinitions.groupId, specificationGroups.id))
    .orderBy(specificationGroups.sortOrder, specificationDefinitions.comparisonPriority);

  // Get all spec values for these trims
  const specValues = await db
    .select({
      trimId: trimSpecificationValues.trimId,
      specId: trimSpecificationValues.specificationDefinitionId,
      valueText: trimSpecificationValues.valueText,
      valueNumber: trimSpecificationValues.valueNumber,
      valueBoolean: trimSpecificationValues.valueBoolean,
    })
    .from(trimSpecificationValues)
    .where(inArray(trimSpecificationValues.trimId, trimIds));

  // Build comparison rows
  const rows: ComparisonRow[] = [];
  for (const spec of allSpecs) {
    const values = trimIds.map((trimId) => {
      const sv = specValues.find(
        (v) => v.trimId === trimId && v.specId === spec.specId
      );
      if (!sv) return null;
      if (sv.valueText) return sv.valueText;
      if (sv.valueNumber) return `${sv.valueNumber}${spec.unit ? ` ${spec.unit}` : ""}`;
      if (sv.valueBoolean !== null) return sv.valueBoolean ? "Да" : "Нет";
      return null;
    });

    // Only include if at least one trim has a value
    if (values.some((v) => v !== null)) {
      rows.push({
        specName: spec.specName,
        specSlug: spec.specSlug,
        groupName: spec.groupName,
        unit: spec.unit,
        values,
      });
    }
  }

  return rows;
}

export async function getTrimsForModel(modelVersionId: string) {
  return db
    .select({
      id: trims.id,
      name: trims.name,
      slug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      basePrice: trims.basePrice,
    })
    .from(trims)
    .where(eq(trims.modelVersionId, modelVersionId))
    .orderBy(trims.basePrice);
}
