import { eq, or, sql, and } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  leads,
  leadConfigurations,
  leadActivities,
  configurationOptionGroups,
  configurationOptions,
  colorPricing,
  carColorImages,
} from "@/db/schema";
import { notifyNewLead } from "@/lib/notifications";

export interface LeadInput {
  name: string;
  phone: string;
  telegram?: string;
  whatsapp?: string;
  email?: string;
  preferredContactMethod?: string;
  trimId?: string;
  brandName?: string;
  modelName?: string;
  trimName?: string;
  sourceCountry?: string;
  condition?: string;
  configurationJson?: {
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options?: string[];
    unpriced_options?: string[];
    totalDelta?: number;
    calculatorBreakdown?: {
      vehiclePrice: number;
      logistics: number;
      customsDuty: number;
      exciseTax: number;
      vat: number;
      certificationFees: number;
      serviceFee: number;
      total: number;
    };
    additional_costs?: { label: string; amount: number }[];
  };
  sourcePrice?: number;
  estimatedTotal?: number;
  currency?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  comment?: string;
  logisticsCost?: number;
  customsCost?: number;
  serviceFee?: number;
  deliveryDays?: number;
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export async function createLead(input: LeadInput) {
  const normalizedPhone = normalizePhone(input.phone);

  const customer = await db
    .select()
    .from(customers)
    .where(
      or(
        eq(customers.phoneNormalized, normalizedPhone),
        input.email ? eq(customers.email, input.email) : sql`false`
      )
    )
    .limit(1);

  let customerId: string;

  if (customer.length > 0) {
    customerId = customer[0].id;
    await db
      .update(customers)
      .set({
        name: input.name,
        phone: input.phone,
        telegram: input.telegram || customer[0].telegram,
        whatsapp: input.whatsapp || customer[0].whatsapp,
        preferredContactMethod: input.preferredContactMethod || customer[0].preferredContactMethod,
      })
      .where(eq(customers.id, customerId));
  } else {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: input.name,
        phone: input.phone,
        phoneNormalized: normalizedPhone,
        telegram: input.telegram,
        whatsapp: input.whatsapp,
        email: input.email,
        preferredContactMethod: input.preferredContactMethod,
      })
      .returning();
    customerId = newCustomer.id;
  }

  const [lead] = await db
    .insert(leads)
    .values({
      customerId,
      trimId: input.trimId,
      status: "new",
      source: input.source || "website",
      estimatedTotalUsd: input.estimatedTotal ? String(input.estimatedTotal) : null,
      currency: input.currency || "USD",
      comment: input.comment,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      referrer: input.referrer,
    })
    .returning();

  if (input.trimId || input.brandName) {
    await db.insert(leadConfigurations).values({
      leadId: lead.id,
      brandName: input.brandName,
      modelName: input.modelName,
      trimName: input.trimName,
      sourceCountry: input.sourceCountry,
      condition: input.condition,
      configurationJson: input.configurationJson,
      sourcePrice: input.sourcePrice ? String(input.sourcePrice) : null,
      sourceCurrency: input.currency,
      estimatedTotal: input.estimatedTotal ? String(input.estimatedTotal) : null,
      logisticsCost: input.logisticsCost ? String(input.logisticsCost) : null,
      customsCost: input.customsCost ? String(input.customsCost) : null,
      serviceFee: input.serviceFee ? String(input.serviceFee) : null,
    });
  }

  await db.insert(leadActivities).values({
    leadId: lead.id,
    type: "lead_created",
    metadataJson: {
      source: input.source,
      vehicle: input.trimId ? `${input.brandName} ${input.modelName} ${input.trimName}` : null,
    },
  });

  // Send notification (non-blocking)
  notifyNewLead({
    leadId: lead.id,
    customerName: input.name,
    customerPhone: input.phone,
    vehicle: input.trimId ? `${input.brandName} ${input.modelName} ${input.trimName}` : undefined,
    source: input.source || "website",
    estimatedTotal: input.estimatedTotal ? String(input.estimatedTotal) : undefined,
  }).catch((err) => console.error("Lead notification error:", err));

  return lead;
}

export async function getConfigurationOptions(trimId: string) {
  const groups = await db
    .select()
    .from(configurationOptionGroups)
    .where(eq(configurationOptionGroups.trimId, trimId))
    .orderBy(configurationOptionGroups.type);

  const result = [];
  for (const group of groups) {
    const options = await db
      .select()
      .from(configurationOptions)
      .where(eq(configurationOptions.groupId, group.id));

    result.push({
      ...group,
      options,
    });
  }

  return result;
}

export async function getColorPricing(trimId: string) {
  const now = new Date().toISOString();
  return db
    .select({
      id: colorPricing.id,
      colorOptionId: colorPricing.colorOptionId,
      priceDelta: colorPricing.priceDelta,
      currency: colorPricing.currency,
    })
    .from(colorPricing)
    .where(
      and(
        eq(colorPricing.trimId, trimId),
        sql`${colorPricing.effectiveFrom}::timestamp <= ${now}::timestamp`,
        sql`(${colorPricing.effectiveTo} IS NULL OR ${colorPricing.effectiveTo}::timestamp > ${now}::timestamp)`
      )
    );
}

export async function getCarColorImages(colorOptionId: string) {
  return db
    .select()
    .from(carColorImages)
    .where(eq(carColorImages.colorOptionId, colorOptionId))
    .orderBy(carColorImages.sortOrder);
}
