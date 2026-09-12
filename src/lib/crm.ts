import { eq, and, or, sql, desc, asc, ilike, gte, lte, count, isNotNull, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  leads,
  customers,
  users,
  leadConfigurations,
  leadNotes,
  leadActivities,
  leadPayments,
  leadMedia,
  quotes as quotesTable,
  vehicleOffers,
  vehicleInventory,
  trims,
  configurationOptionGroups,
  configurationOptions,
  carModels,
  brands,
  modelVersions,
  vehicleMedia,
} from "@/db/schema";
import { calculate, type CalculatorInput } from "@/lib/calculator";

export interface LeadFilters {
  status?: string;
  assignedManagerId?: string;
  source?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
  page?: number;
  pageSize?: number;
}

export async function getLeads(filters: LeadFilters = {}) {
  const {
    status,
    assignedManagerId,
    source,
    search,
    dateFrom,
    dateTo,
    budgetMin,
    budgetMax,
    page = 1,
    pageSize = 20,
  } = filters;

  const conditions = [];

  if (status) conditions.push(eq(leads.status, status as any));
  if (assignedManagerId) conditions.push(eq(leads.assignedManagerId, assignedManagerId));
  if (source) conditions.push(eq(leads.source, source));
  if (dateFrom) conditions.push(gte(leads.createdAt, new Date(dateFrom)));
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    if (endOfDay.getHours() === 0 && endOfDay.getMinutes() === 0 && endOfDay.getSeconds() === 0) {
      endOfDay.setHours(23, 59, 59, 999);
    }
    conditions.push(lte(leads.createdAt, endOfDay));
  }
  if (budgetMin) conditions.push(gte(leads.estimatedTotalUsd, String(budgetMin)));
  if (budgetMax) conditions.push(lte(leads.estimatedTotalUsd, String(budgetMax)));

  if (search) {
    conditions.push(
      or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(leadConfigurations.modelName, `%${search}%`),
        ilike(leadConfigurations.brandName, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * pageSize;

  const [totalResult] = await db
    .select({ total: count() })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(leadConfigurations, eq(leads.id, leadConfigurations.leadId))
    .where(where);

  const total = totalResult?.total || 0;

  const results = await db
    .select({
      id: leads.id,
      status: leads.status,
      source: leads.source,
      estimatedTotalUsd: leads.estimatedTotalUsd,
      comment: leads.comment,
      createdAt: leads.createdAt,
      nextFollowUpAt: leads.nextFollowUpAt,
      lastContactAt: leads.lastContactAt,
      // Customer
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerTelegram: customers.telegram,
      customerWhatsapp: customers.whatsapp,
      // Assigned manager
      assignedManagerId: users.id,
      assignedManagerName: users.name,
      // Configuration
      brandName: leadConfigurations.brandName,
      modelName: leadConfigurations.modelName,
      trimName: leadConfigurations.trimName,
      sourceCountry: leadConfigurations.sourceCountry,
      condition: leadConfigurations.condition,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(leadConfigurations, eq(leads.id, leadConfigurations.leadId))
    .leftJoin(users, eq(leads.assignedManagerId, users.id))
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    leads: results,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLeadById(id: string) {
  const [lead] = await db
    .select({
      id: leads.id,
      status: leads.status,
      journeyStage: leads.journeyStage,
      source: leads.source,
      trimId: leads.trimId,
      estimatedTotalUsd: leads.estimatedTotalUsd,
      currency: leads.currency,
      comment: leads.comment,
      utmSource: leads.utmSource,
      utmMedium: leads.utmMedium,
      utmCampaign: leads.utmCampaign,
      referrer: leads.referrer,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      nextFollowUpAt: leads.nextFollowUpAt,
      lastContactAt: leads.lastContactAt,
      // Customer
      customerId: customers.id,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerPhoneNormalized: customers.phoneNormalized,
      customerTelegram: customers.telegram,
      customerWhatsapp: customers.whatsapp,
      customerEmail: customers.email,
      customerPreferredContact: customers.preferredContactMethod,
      // Assigned manager
      assignedManagerId: users.id,
      assignedManagerName: users.name,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(users, eq(leads.assignedManagerId, users.id))
    .where(eq(leads.id, id))
    .limit(1);

  if (!lead) return null;

  const [config] = await db
    .select()
    .from(leadConfigurations)
    .where(eq(leadConfigurations.leadId, id))
    .limit(1);

  const notes = await db
    .select({
      id: leadNotes.id,
      body: leadNotes.body,
      createdAt: leadNotes.createdAt,
      userId: leadNotes.userId,
      userName: users.name,
    })
    .from(leadNotes)
    .innerJoin(users, eq(leadNotes.userId, users.id))
    .where(eq(leadNotes.leadId, id))
    .orderBy(desc(leadNotes.createdAt));

  const activities = await db
    .select({
      id: leadActivities.id,
      type: leadActivities.type,
      metadataJson: leadActivities.metadataJson,
      createdAt: leadActivities.createdAt,
      userId: leadActivities.userId,
      userName: users.name,
    })
    .from(leadActivities)
    .leftJoin(users, eq(leadActivities.userId, users.id))
    .where(eq(leadActivities.leadId, id))
    .orderBy(desc(leadActivities.createdAt));

  let computedBreakdown = null;
  let resolvedOptionsWithPrices: {
    name: string;
    priceDelta: number;
    priceKnown: boolean;
    groupType: string;
  }[] | null = null;

  if (config) {
    const configJson = config.configurationJson as Record<string, unknown> | null;
    const hasBreakdown = configJson?.calculatorBreakdown;
    const hasOptionsWithPrices = configJson?.options_with_prices;

    // Compute breakdown if missing
    if (!hasBreakdown && lead.estimatedTotalUsd && lead.trimId) {
      const [trim] = await db
        .select()
        .from(trims)
        .where(eq(trims.id, lead.trimId))
        .limit(1);

      if (trim) {
        const calcResult = await calculate({
          sourceCountry: config.sourceCountry || "Китай",
          condition: (config.condition as "new" | "used") || "new",
          purchasePrice: Number(config.sourcePrice) || Number(lead.estimatedTotalUsd),
          currency: lead.currency || "USD",
          powertrain: (trim.powertrainType as CalculatorInput["powertrain"]) || "petrol",
          engineDisplacementCc: trim.engineDisplacementCc ?? undefined,
          enginePowerHp: trim.enginePowerHp ?? undefined,
          motorPowerKw: trim.motorPowerKw ?? undefined,
          batteryCapacityKwh: trim.batteryCapacityKwh ? Number(trim.batteryCapacityKwh) : undefined,
          trimId: lead.trimId,
        });

        if (calcResult) {
          computedBreakdown = {
            vehiclePrice: calcResult.vehiclePrice,
            logistics: calcResult.logistics,
            customsDuty: calcResult.customsDuty,
            exciseTax: calcResult.exciseTax,
            vat: calcResult.vat,
            certificationFees: calcResult.certificationFees,
            serviceFee: calcResult.serviceFee,
            total: calcResult.total,
          };
        }
      }
    }

    // Look up per-option prices from DB if not stored in configurationJson
    if (!hasOptionsWithPrices && lead.trimId) {
      const optionNames = (configJson?.options as string[]) || [];
      const extColor = configJson?.exterior_color as string | undefined;
      const intColor = configJson?.interior_color as string | undefined;
      const wheels = configJson?.wheels as string | undefined;
      const allNames = [
        ...(extColor ? [extColor] : []),
        ...(intColor ? [intColor] : []),
        ...(wheels ? [wheels] : []),
        ...optionNames,
      ];

      if (allNames.length > 0) {
        const groups = await db
          .select()
          .from(configurationOptionGroups)
          .where(eq(configurationOptionGroups.trimId, lead.trimId));

        const groupIds = groups.map((g) => g.id);
        const groupTypeMap = new Map(groups.map((g) => [g.id, g.type]));

        if (groupIds.length > 0) {
          const allOptions = await db
            .select()
            .from(configurationOptions)
            .where(
              groupIds.length === 1
                ? eq(configurationOptions.groupId, groupIds[0])
                : sql`${configurationOptions.groupId} IN (${sql.join(
                    groupIds.map((id) => sql`${id}`),
                    sql`, `
                  )})`
            );

          const optionsByName = new Map(allOptions.map((o) => [o.name, o]));
          const resolved: {
            name: string;
            priceDelta: number;
            priceKnown: boolean;
            groupType: string;
          }[] = [];

          for (const name of allNames) {
            const opt = optionsByName.get(name);
            if (opt) {
              const groupType = groupTypeMap.get(opt.groupId) || "standalone_option";
              resolved.push({
                name: opt.name,
                priceDelta: opt.priceDelta ? Number(opt.priceDelta) : 0,
                priceKnown: opt.priceKnown,
                groupType,
              });
            }
          }

          if (resolved.length > 0) {
            resolvedOptionsWithPrices = resolved;
          }
        }
      }
    }
  }

  const [vehicle] = await db
    .select({
      id: vehicleInventory.id,
      trimId: vehicleInventory.trimId,
      status: vehicleInventory.status,
      location: vehicleInventory.location,
      vin: vehicleInventory.vin,
      expectedDate: vehicleInventory.expectedDate,
      reservedAt: vehicleInventory.reservedAt,
      trimName: trims.name,
      modelName: carModels.name,
      brandName: brands.name,
    })
    .from(vehicleInventory)
    .innerJoin(trims, eq(vehicleInventory.trimId, trims.id))
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .where(eq(vehicleInventory.reservedBy, id))
    .limit(1);

  const payments = await db
    .select()
    .from(leadPayments)
    .where(eq(leadPayments.leadId, id))
    .orderBy(asc(leadPayments.sortOrder), asc(leadPayments.createdAt));

  const leadQuotes = await db
    .select()
    .from(quotesTable)
    .where(eq(quotesTable.leadId, id))
    .orderBy(desc(quotesTable.createdAt));

  const media = await db
    .select()
    .from(leadMedia)
    .where(eq(leadMedia.leadId, id))
    .orderBy(asc(leadMedia.sortOrder), asc(leadMedia.createdAt));

  const serializeQuote = (q: typeof leadQuotes[number]) => ({
    id: q.id,
    status: q.status,
    configurationJson: q.configurationJson,
    pdfUrl: q.pdfUrl,
    validUntil: q.validUntil ? q.validUntil.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    sentAt: q.sentAt ? q.sentAt.toISOString() : null,
  });

  return {
    ...lead,
    configuration: config || null,
    computedBreakdown,
    resolvedOptionsWithPrices,
    notes,
    activities,
    quotes: leadQuotes.map(serializeQuote),
    media: media.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    payments: payments.map((p) => ({
      ...p,
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    })),
    vehicle: vehicle
      ? {
          ...vehicle,
          expectedDate: vehicle.expectedDate ? vehicle.expectedDate.toISOString() : null,
          reservedAt: vehicle.reservedAt ? vehicle.reservedAt.toISOString() : null,
        }
      : null,
  };
}

export async function updateLeadStatus(leadId: string, status: string, userId: string) {
  await db
    .update(leads)
    .set({ status: status as any, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId,
    type: "status_changed",
    metadataJson: { newStatus: status },
  });
}

export async function updateLeadJourneyStage(leadId: string, stage: number, userId: string) {
  const [current] = await db
    .select({ journeyStage: leads.journeyStage })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!current) return;

  await db
    .update(leads)
    .set({ journeyStage: stage, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  if (current.journeyStage !== stage) {
    await db.insert(leadActivities).values({
      leadId,
      userId,
      type: "journey_stage_changed",
      metadataJson: { stage, previousStage: current.journeyStage },
    });
  }
}

export async function assignLead(leadId: string, managerId: string, adminId: string) {
  await db
    .update(leads)
    .set({ assignedManagerId: managerId, status: "assigned", updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId: adminId,
    type: "assigned",
    metadataJson: { managerId },
  });
}

export async function updateLeadSource(leadId: string, source: string | null, userId: string) {
  await db
    .update(leads)
    .set({ source, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId,
    type: "source_changed",
    metadataJson: { newSource: source },
  });
}

export async function addNote(leadId: string, userId: string, body: string) {
  const [note] = await db
    .insert(leadNotes)
    .values({ leadId, userId, body })
    .returning();

  await db.insert(leadActivities).values({
    leadId,
    userId,
    type: "note_added",
    metadataJson: { notePreview: body.slice(0, 100) },
  });

  return note;
}

export async function setFollowUp(leadId: string, datetime: string | null) {
  await db
    .update(leads)
    .set({ nextFollowUpAt: datetime ? new Date(datetime) : null, updatedAt: new Date() })
    .where(eq(leads.id, leadId));
}

export async function updateLeadEstimate(
  leadId: string,
  estimatedTotal: number | null,
  additionalCosts: { label: string; amount: number }[] | null,
  userId: string,
  calculatorBreakdown?: Record<string, number> | null,
  optionsWithPrices?: { name: string; priceDelta: number; priceKnown: boolean; groupType: string }[] | null,
  carOptions?: { label: string; amount: number }[] | null
) {
  if (estimatedTotal !== null) {
    await db
      .update(leads)
      .set({ estimatedTotalUsd: String(estimatedTotal), updatedAt: new Date() })
      .where(eq(leads.id, leadId));
  }

  const [existing] = await db
    .select({ id: leadConfigurations.id, configurationJson: leadConfigurations.configurationJson })
    .from(leadConfigurations)
    .where(eq(leadConfigurations.leadId, leadId))
    .limit(1);

  if (existing) {
    const currentConfig = (existing.configurationJson as Record<string, unknown>) || {};
    await db
      .update(leadConfigurations)
      .set({
        estimatedTotal: estimatedTotal !== null ? String(estimatedTotal) : existing.configurationJson ? undefined : null,
        configurationJson: {
          ...currentConfig,
          ...(additionalCosts != null ? { additional_costs: additionalCosts } : {}),
          ...(calculatorBreakdown != null ? { calculatorBreakdown } : {}),
          ...(optionsWithPrices != null ? { options_with_prices: optionsWithPrices } : {}),
          ...(carOptions != null ? { car_options: carOptions } : {}),
        },
      })
      .where(eq(leadConfigurations.leadId, leadId));
  }

  await db.insert(leadActivities).values({
    leadId,
    userId,
    type: "estimate_updated",
    metadataJson: {
      estimatedTotal,
      additionalCosts: additionalCosts || [],
    },
  });
}

export async function getDashboardStats(userId?: string, role?: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

  // Leads today
  const [todayResult] = await db
    .select({ total: count() })
    .from(leads)
    .where(gte(leads.createdAt, todayStart));

  // Leads this week
  const [weekResult] = await db
    .select({ total: count() })
    .from(leads)
    .where(gte(leads.createdAt, weekStart));

  // Leads by status
  const byStatus = await db
    .select({ status: leads.status, total: count() })
    .from(leads)
    .groupBy(leads.status);

  // Leads by manager
  const byManager = await db
    .select({
      managerId: leads.assignedManagerId,
      managerName: users.name,
      total: count(),
    })
    .from(leads)
    .leftJoin(users, eq(leads.assignedManagerId, users.id))
    .groupBy(leads.assignedManagerId, users.name);

  // Top requested cars
  const topCars = await db
    .select({
      brandName: leadConfigurations.brandName,
      modelName: leadConfigurations.modelName,
      total: count(),
    })
    .from(leadConfigurations)
    .innerJoin(leads, eq(leadConfigurations.leadId, leads.id))
    .groupBy(leadConfigurations.brandName, leadConfigurations.modelName)
    .orderBy(desc(count()))
    .limit(5);

  // Follow-ups overdue
  const [overdueResult] = await db
    .select({ total: count() })
    .from(leads)
    .where(
      and(
        lte(leads.nextFollowUpAt, now),
        eq(leads.status, "needs_follow_up")
      )
    );

  return {
    today: todayResult?.total || 0,
    thisWeek: weekResult?.total || 0,
    byStatus,
    byManager,
    topCars,
    overdueFollowUps: overdueResult?.total || 0,
  };
}

export async function getAllManagers() {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.active, true))
    .orderBy(asc(users.name));
}

export async function getFollowUpTasks(limit = 100) {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  return db
    .select({
      id: leads.id,
      status: leads.status,
      estimatedTotalUsd: leads.estimatedTotalUsd,
      nextFollowUpAt: leads.nextFollowUpAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      assignedManagerName: users.name,
      brandName: leadConfigurations.brandName,
      modelName: leadConfigurations.modelName,
      trimName: leadConfigurations.trimName,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(leadConfigurations, eq(leads.id, leadConfigurations.leadId))
    .leftJoin(users, eq(leads.assignedManagerId, users.id))
    .where(
      and(
        isNotNull(leads.nextFollowUpAt),
        lte(leads.nextFollowUpAt, endOfDay),
        notInArray(leads.status, ["won", "lost"])
      )
    )
    .orderBy(asc(leads.nextFollowUpAt))
    .limit(limit);
}

export async function completeFollowUp(leadId: string, userId: string) {
  await db
    .update(leads)
    .set({ nextFollowUpAt: null, lastContactAt: new Date(), updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId,
    type: "follow_up_completed",
    metadataJson: {},
  });
}

export interface SelectorTrimResult {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  bodyType: string | null;
  powertrainType: string | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
  score: number;
}

interface RecLookup {
  text: string;
  score: number;
  trimId?: string;
  reasons?: string[];
}

const trimSelectFields = {
  trimId: trims.id,
  trimName: trims.name,
  trimSlug: trims.slug,
  modelName: carModels.name,
  modelSlug: carModels.slug,
  brandName: brands.name,
  bodyType: carModels.bodyType,
  powertrainType: trims.powertrainType,
  rangeKm: trims.rangeKm,
  acceleration0100: trims.acceleration0100,
  estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
  imageUrl: vehicleMedia.url,
};

function trimQuery() {
  return db
    .select(trimSelectFields)
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .leftJoin(vehicleOffers, eq(trims.id, vehicleOffers.trimId))
    .leftJoin(
      vehicleMedia,
      and(
        eq(modelVersions.id, vehicleMedia.modelVersionId),
        eq(vehicleMedia.sortOrder, 0)
      )
    );
}

export async function lookupSelectorTrims(
  recTexts: RecLookup[]
): Promise<SelectorTrimResult[]> {
  if (recTexts.length === 0) return [];

  const withIds = recTexts.filter((r) => r.trimId);
  const withoutIds = recTexts.filter((r) => !r.trimId);

  const results: SelectorTrimResult[] = [];

  for (const rec of withIds) {
    const [match] = await trimQuery()
      .where(eq(trims.id, rec.trimId!))
      .limit(1);

    if (match) {
      results.push(formatMatch(match, rec));
    }
  }

  for (const rec of withoutIds) {
    const match = await fuzzyMatchTrim(rec.text);
    if (match) {
      results.push(formatMatch(match, rec));
    }
  }

  return results;
}

async function fuzzyMatchTrim(text: string) {
  const parts = text.trim().split(/\s+/);
  if (parts.length < 3) return null;

  const brand = parts[0];
  const rest = parts.slice(1).join(" ");

  const brandTrims = await trimQuery().where(ilike(brands.name, brand));

  for (const t of brandTrims) {
    const modelLower = t.modelName.toLowerCase();
    const trimLower = t.trimName.toLowerCase();
    const restLower = rest.toLowerCase();

    if (restLower.startsWith(modelLower)) {
      const afterModel = restLower.slice(modelLower.length).trim();
      if (afterModel === trimLower) {
        return t;
      }
    }
  }

  return null;
}

function formatMatch(
  match: any,
  rec: RecLookup
): SelectorTrimResult {
  return {
    trimId: match.trimId,
    trimName: match.trimName,
    trimSlug: match.trimSlug,
    modelName: match.modelName,
    modelSlug: match.modelSlug,
    brandName: match.brandName,
    bodyType: match.bodyType,
    powertrainType: match.powertrainType,
    rangeKm: match.rangeKm,
    acceleration0100: match.acceleration0100 ? String(match.acceleration0100) : null,
    estimatedTotalUsd: match.estimatedTotalUsd ? String(match.estimatedTotalUsd) : null,
    imageUrl: match.imageUrl,
    score: rec.score,
  };
}
