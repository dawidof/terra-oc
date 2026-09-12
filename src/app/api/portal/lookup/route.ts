import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  leads,
  customers,
  users,
  leadConfigurations,
  leadActivities,
  leadMedia,
  leadPayments,
  quotes,
  vehicleInventory,
  trims,
  vehicleMedia,
} from "@/db/schema";
import { eq, or, desc, asc, and, isNotNull } from "drizzle-orm";
import { buildJourneySteps, getJourneyStage, JOURNEY_TOTAL } from "@/lib/journey";

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

interface LeadRow {
  id: string;
  status: string;
  journeyStage: number;
  estimatedTotalUsd: string | null;
  createdAt: Date;
  customerName: string;
  customerPhone?: string | null;
  trimId: string | null;
  managerName?: string | null;
}

async function fetchVehicleForLead(leadId: string) {
  const [vehicle] = await db
    .select({
      id: vehicleInventory.id,
      status: vehicleInventory.status,
      vin: vehicleInventory.vin,
      location: vehicleInventory.location,
      expectedDate: vehicleInventory.expectedDate,
      trimId: vehicleInventory.trimId,
    })
    .from(vehicleInventory)
    .where(eq(vehicleInventory.reservedBy, leadId))
    .limit(1);
  return vehicle ?? null;
}

async function fetchJourney(lead: LeadRow) {
  const stage = getJourneyStage(lead.journeyStage);

  const changes = await db
    .select({
      stage: leadActivities.metadataJson,
      createdAt: leadActivities.createdAt,
    })
    .from(leadActivities)
    .where(
      and(
        eq(leadActivities.leadId, lead.id),
        eq(leadActivities.type, "journey_stage_changed")
      )
    )
    .orderBy(desc(leadActivities.createdAt));

  const confirmedAtByStage: Record<number, string> = {};
  for (const change of changes) {
    const meta = change.stage as { stage?: number } | null;
    const stageNum = Number(meta?.stage);
    if (stageNum >= 1 && stageNum <= JOURNEY_TOTAL && !confirmedAtByStage[stageNum]) {
      confirmedAtByStage[stageNum] = change.createdAt.toISOString();
    }
  }

  return {
    currentStage: lead.journeyStage,
    currentLabel: stage.label,
    total: JOURNEY_TOTAL,
    steps: buildJourneySteps(lead.journeyStage, confirmedAtByStage),
  };
}

async function fetchPhotos(lead: LeadRow, vehicle: { trimId: string } | null) {
  const trimId = lead.trimId || vehicle?.trimId || null;
  if (!trimId) return [];

  const [trim] = await db
    .select({ modelVersionId: trims.modelVersionId })
    .from(trims)
    .where(eq(trims.id, trimId))
    .limit(1);

  if (!trim) return [];

  const media = await db
    .select({ url: vehicleMedia.url, alt: vehicleMedia.alt })
    .from(vehicleMedia)
    .where(
      and(
        eq(vehicleMedia.modelVersionId, trim.modelVersionId),
        isNotNull(vehicleMedia.url)
      )
    )
    .orderBy(asc(vehicleMedia.sortOrder))
    .limit(6);

  return media;
}

async function fetchPayments(leadId: string) {
  const payments = await db
    .select({
      id: leadPayments.id,
      label: leadPayments.label,
      amount: leadPayments.amount,
      currency: leadPayments.currency,
      dueDate: leadPayments.dueDate,
      paidAt: leadPayments.paidAt,
      sortOrder: leadPayments.sortOrder,
    })
    .from(leadPayments)
    .where(eq(leadPayments.leadId, leadId))
    .orderBy(asc(leadPayments.sortOrder), asc(leadPayments.createdAt));

  return payments.map((p) => ({
    ...p,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
  }));
}

async function fetchQuotes(leadId: string) {
  return db
    .select({
      id: quotes.id,
      status: quotes.status,
      configurationJson: quotes.configurationJson,
      pdfUrl: quotes.pdfUrl,
      validUntil: quotes.validUntil,
      createdAt: quotes.createdAt,
      sentAt: quotes.sentAt,
    })
    .from(quotes)
    .where(eq(quotes.leadId, leadId))
    .orderBy(desc(quotes.createdAt));
}

async function fetchMessages(leadId: string) {
  const activities = await db
    .select({
      metadataJson: leadActivities.metadataJson,
      createdAt: leadActivities.createdAt,
    })
    .from(leadActivities)
    .where(
      and(
        eq(leadActivities.leadId, leadId),
        eq(leadActivities.type, "client_message")
      )
    )
    .orderBy(desc(leadActivities.createdAt))
    .limit(20);

  return activities
    .map((a) => {
      const meta = a.metadataJson as { message?: string } | null;
      return {
        message: meta?.message || "",
        createdAt: a.createdAt.toISOString(),
      };
    })
    .filter((m) => m.message);
}

async function fetchInspectionMedia(leadId: string) {
  const media = await db
    .select({
      id: leadMedia.id,
      kind: leadMedia.kind,
      url: leadMedia.url,
      caption: leadMedia.caption,
      mimeType: leadMedia.mimeType,
      createdAt: leadMedia.createdAt,
    })
    .from(leadMedia)
    .where(and(eq(leadMedia.leadId, leadId), eq(leadMedia.published, true)))
    .orderBy(asc(leadMedia.sortOrder), asc(leadMedia.createdAt));

  return media.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}

async function buildOrderResponse(lead: LeadRow) {
  const [config] = await db
    .select()
    .from(leadConfigurations)
    .where(eq(leadConfigurations.leadId, lead.id))
    .limit(1);

  const [leadQuotes, vehicle, journey, payments] = await Promise.all([
    fetchQuotes(lead.id),
    fetchVehicleForLead(lead.id),
    fetchJourney(lead),
    fetchPayments(lead.id),
  ]);
  const photos = await fetchPhotos(lead, vehicle);
  const messages = await fetchMessages(lead.id);
  const inspectionMedia = await fetchInspectionMedia(lead.id);

  return {
    lead: {
      id: lead.id,
      status: lead.status,
      customerName: lead.customerName,
      estimatedTotalUsd: lead.estimatedTotalUsd,
      createdAt: lead.createdAt,
      managerName: lead.managerName ?? null,
    },
    configuration: config || null,
    quotes: leadQuotes,
    vehicle,
    journey,
    photos,
    payments,
    messages,
    inspectionMedia,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone");
  const quoteId = searchParams.get("quoteId");
  const leadId = searchParams.get("leadId");

  if (!phone && !quoteId && !leadId) {
    return NextResponse.json(
      { error: "Укажите номер телефона, ID расчёта или ID заказа" },
      { status: 400 }
    );
  }

  const leadColumns = {
    id: leads.id,
    status: leads.status,
    journeyStage: leads.journeyStage,
    estimatedTotalUsd: leads.estimatedTotalUsd,
    createdAt: leads.createdAt,
    customerName: customers.name,
    customerPhone: customers.phone,
    trimId: leads.trimId,
    managerName: users.name,
  };

  const leadQuery = () =>
    db
      .select(leadColumns)
      .from(leads)
      .innerJoin(customers, eq(leads.customerId, customers.id))
      .leftJoin(users, eq(leads.assignedManagerId, users.id));

  try {
    // ─── Lookup by lead ID ──────────────────────────────────────────────
    if (leadId) {
      const [lead] = await leadQuery()
        .where(eq(leads.id, leadId))
        .limit(1);

      if (!lead) {
        return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
      }

      return NextResponse.json(await buildOrderResponse(lead));
    }

    // ─── Lookup by quote ID ─────────────────────────────────────────────
    if (quoteId) {
      const [quote] = await db
        .select({ leadId: quotes.leadId })
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!quote) {
        return NextResponse.json(
          { error: "Расчёт не найден" },
          { status: 404 }
        );
      }

      const [lead] = await leadQuery()
        .where(eq(leads.id, quote.leadId))
        .limit(1);

      if (!lead) {
        return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
      }

      const response = await buildOrderResponse(lead);
      const [singleQuote] = await db
        .select({
          id: quotes.id,
          status: quotes.status,
          configurationJson: quotes.configurationJson,
          validUntil: quotes.validUntil,
          createdAt: quotes.createdAt,
          sentAt: quotes.sentAt,
        })
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      return NextResponse.json({ ...response, quotes: [singleQuote] });
    }

    // ─── Lookup by phone ────────────────────────────────────────────────
    if (phone) {
      const searchDigits = normalizePhone(phone);

      // Fetch all customers and match in JS for reliability
      const allCustomers = await db
        .select({ id: customers.id, phone: customers.phone })
        .from(customers);

      const matchingCustomerIds = allCustomers
        .filter((c) => c.phone && normalizePhone(c.phone).includes(searchDigits))
        .map((c) => c.id);

      if (matchingCustomerIds.length === 0) {
        return NextResponse.json(
          { error: "Заказы не найдены" },
          { status: 404 }
        );
      }

      const customerLeads = await leadQuery()
        .where(
          matchingCustomerIds.length === 1
            ? eq(leads.customerId, matchingCustomerIds[0])
            : or(...matchingCustomerIds.map((id) => eq(leads.customerId, id)))
        )
        .orderBy(desc(leads.createdAt));

      if (customerLeads.length === 0) {
        return NextResponse.json(
          { error: "Заказы не найдены" },
          { status: 404 }
        );
      }

      const results = [];
      for (const lead of customerLeads) {
        results.push(await buildOrderResponse(lead));
      }

      return NextResponse.json({ orders: results });
    }

    return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });
  } catch (error) {
    console.error("Portal lookup error:", error);
    return NextResponse.json(
      { error: "Ошибка при поиске заказа" },
      { status: 500 }
    );
  }
}
