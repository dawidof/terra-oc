import { eq, and, or, sql, desc, asc, ilike, gte, lte, count } from "drizzle-orm";
import { db } from "@/db";
import {
  leads,
  customers,
  users,
  leadConfigurations,
  leadNotes,
  leadActivities,
  vehicleOffers,
} from "@/db/schema";

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
  if (dateTo) conditions.push(lte(leads.createdAt, new Date(dateTo)));
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
      source: leads.source,
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

  return {
    ...lead,
    configuration: config || null,
    notes,
    activities,
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
