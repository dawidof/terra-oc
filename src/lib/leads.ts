import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  customers,
  leads,
  leadConfigurations,
  leadActivities,
  configurationOptionGroups,
  configurationOptions,
} from "@/db/schema";

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
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export async function createLead(input: LeadInput) {
  const normalizedPhone = normalizePhone(input.phone);

  let customer = await db
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
