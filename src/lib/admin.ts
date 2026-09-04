import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  trims,
  vehicleOffers,
  carModels,
  reviews,
  siteSettings,
  auditLogs,
} from "@/db/schema";

const TRIM_UPDATABLE_FIELDS = new Set([
  "name",
  "powertrainType",
  "drivetrain",
  "motorPowerKw",
  "rangeKm",
  "acceleration0100",
  "batteryCapacityKwh",
  "basePrice",
  "basePriceCurrency",
  "active",
]);

const OFFER_UPDATABLE_FIELDS = new Set([
  "sourcePrice",
  "sourceCurrency",
  "estimatedTotalUsd",
  "deliveryDays",
  "sourceCountry",
  "condition",
  "modelYear",
]);

const REVIEW_UPDATABLE_FIELDS = new Set([
  "name",
  "city",
  "rating",
  "vehicleLabel",
  "text",
  "published",
  "featured",
  "sortOrder",
]);

export async function logAudit(
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  before: any,
  after: any
) {
  await db.insert(auditLogs).values({
    userId,
    entityType,
    entityId,
    action,
    beforeJson: before,
    afterJson: after,
  });
}

export async function updateTrimField(
  trimId: string,
  field: string,
  value: any,
  userId: string
) {
  if (!TRIM_UPDATABLE_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not updatable`);
  }

  const [before] = await db.select().from(trims).where(eq(trims.id, trimId)).limit(1);
  if (!before) throw new Error("Trim not found");

  const beforeValue = (before as any)[field];
  await db.update(trims).set({ [field]: value }).where(eq(trims.id, trimId));

  await logAudit(userId, "trim", trimId, `update_${field}`, { [field]: beforeValue }, { [field]: value });

  return { success: true };
}

export async function updateOfferField(
  offerId: string,
  field: string,
  value: any,
  userId: string
) {
  if (!OFFER_UPDATABLE_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not updatable`);
  }

  const [before] = await db.select().from(vehicleOffers).where(eq(vehicleOffers.id, offerId)).limit(1);
  if (!before) throw new Error("Offer not found");

  const beforeValue = (before as any)[field];
  await db.update(vehicleOffers).set({ [field]: value }).where(eq(vehicleOffers.id, offerId));

  await logAudit(userId, "offer", offerId, `update_${field}`, { [field]: beforeValue }, { [field]: value });

  return { success: true };
}

export async function updateReview(
  reviewId: string,
  data: Record<string, any>,
  userId: string
) {
  const [before] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!before) throw new Error("Review not found");

  const changes: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (!REVIEW_UPDATABLE_FIELDS.has(key)) continue;
    if (before[key as keyof typeof before] !== data[key]) {
      changes[key] = data[key];
    }
  }

  if (Object.keys(changes).length === 0) return { success: true, noChanges: true };

  await db.update(reviews).set(changes).where(eq(reviews.id, reviewId));

  await logAudit(
    userId,
    "review",
    reviewId,
    "update",
    Object.fromEntries(Object.keys(changes).map((k) => [k, before[k as keyof typeof before]])),
    changes
  );

  return { success: true };
}

export async function updateSiteSetting(key: string, value: any, userId: string) {
  const [before] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);

  if (before) {
    await db.update(siteSettings).set({ valueJson: value }).where(eq(siteSettings.key, key));
    await logAudit(userId, "site_settings", key, "update", { value: before.valueJson }, { value });
  } else {
    await db.insert(siteSettings).values({ key, valueJson: value });
    await logAudit(userId, "site_settings", key, "create", null, { value });
  }

  return { success: true };
}

export async function getAuditLogs(options: {
  entityType?: string;
  entityId?: string;
  limit?: number;
} = {}) {
  const { entityType, entityId, limit = 50 } = options;

  const conditions = [];
  if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
  if (entityId) conditions.push(eq(auditLogs.entityId, entityId));

  const where = conditions.length > 0 ? conditions[0] : undefined;

  return db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getTrimWithOffer(trimId: string) {
  const [result] = await db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      basePrice: trims.basePrice,
      basePriceCurrency: trims.basePriceCurrency,
      active: trims.active,
      offerId: vehicleOffers.id,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      sourcePrice: vehicleOffers.sourcePrice,
      deliveryDays: vehicleOffers.deliveryDays,
    })
    .from(trims)
    .leftJoin(vehicleOffers, eq(trims.id, vehicleOffers.trimId))
    .where(eq(trims.id, trimId))
    .limit(1);

  return result || null;
}
