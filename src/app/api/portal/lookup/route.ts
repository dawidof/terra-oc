import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, customers, leadConfigurations, quotes, vehicleInventory } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

async function fetchVehicleForLead(leadId: string) {
  const [vehicle] = await db
    .select({
      status: vehicleInventory.status,
      vin: vehicleInventory.vin,
      location: vehicleInventory.location,
      expectedDate: vehicleInventory.expectedDate,
    })
    .from(vehicleInventory)
    .where(eq(vehicleInventory.reservedBy, leadId))
    .limit(1);
  return vehicle ?? null;
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

  try {
    // ─── Lookup by lead ID ──────────────────────────────────────────────
    if (leadId) {
      const [lead] = await db
        .select({
          id: leads.id,
          status: leads.status,
          estimatedTotalUsd: leads.estimatedTotalUsd,
          createdAt: leads.createdAt,
          customerName: customers.name,
          customerPhone: customers.phone,
        })
        .from(leads)
        .innerJoin(customers, eq(leads.customerId, customers.id))
        .where(eq(leads.id, leadId))
        .limit(1);

      if (!lead) {
        return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
      }

      const [config] = await db
        .select()
        .from(leadConfigurations)
        .where(eq(leadConfigurations.leadId, leadId))
        .limit(1);

      const leadQuotes = await db
        .select()
        .from(quotes)
        .where(eq(quotes.leadId, leadId))
        .orderBy(desc(quotes.createdAt));

      return NextResponse.json({
        lead: {
          id: lead.id,
          status: lead.status,
          customerName: lead.customerName,
          estimatedTotalUsd: lead.estimatedTotalUsd,
          createdAt: lead.createdAt,
        },
        configuration: config || null,
        quotes: leadQuotes,
        vehicle: await fetchVehicleForLead(leadId),
      });
    }

    // ─── Lookup by quote ID ─────────────────────────────────────────────
    if (quoteId) {
      const [quote] = await db
        .select({
          id: quotes.id,
          leadId: quotes.leadId,
          status: quotes.status,
          configurationJson: quotes.configurationJson,
          validUntil: quotes.validUntil,
          createdAt: quotes.createdAt,
          sentAt: quotes.sentAt,
        })
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (!quote) {
        return NextResponse.json(
          { error: "Расчёт не найден" },
          { status: 404 }
        );
      }

      const [lead] = await db
        .select({
          id: leads.id,
          status: leads.status,
          estimatedTotalUsd: leads.estimatedTotalUsd,
          createdAt: leads.createdAt,
          customerName: customers.name,
          customerPhone: customers.phone,
        })
        .from(leads)
        .innerJoin(customers, eq(leads.customerId, customers.id))
        .where(eq(leads.id, quote.leadId))
        .limit(1);

      if (!lead) {
        return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
      }

      const [config] = await db
        .select()
        .from(leadConfigurations)
        .where(eq(leadConfigurations.leadId, quote.leadId))
        .limit(1);

      return NextResponse.json({
        lead: {
          id: lead.id,
          status: lead.status,
          customerName: lead.customerName,
          estimatedTotalUsd: lead.estimatedTotalUsd,
          createdAt: lead.createdAt,
        },
        configuration: config || null,
        quotes: [
          {
            id: quote.id,
            status: quote.status,
            configurationJson: quote.configurationJson,
            validUntil: quote.validUntil,
            createdAt: quote.createdAt,
            sentAt: quote.sentAt,
          },
        ],
        vehicle: await fetchVehicleForLead(quote.leadId),
      });
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

      const customerLeads = await db
        .select({
          id: leads.id,
          status: leads.status,
          estimatedTotalUsd: leads.estimatedTotalUsd,
          createdAt: leads.createdAt,
          customerName: customers.name,
        })
        .from(leads)
        .innerJoin(customers, eq(leads.customerId, customers.id))
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
        const [config] = await db
          .select()
          .from(leadConfigurations)
          .where(eq(leadConfigurations.leadId, lead.id))
          .limit(1);

        const leadQuotes = await db
          .select()
          .from(quotes)
          .where(eq(quotes.leadId, lead.id))
          .orderBy(desc(quotes.createdAt));

        results.push({
          lead: {
            id: lead.id,
            status: lead.status,
            customerName: lead.customerName,
            estimatedTotalUsd: lead.estimatedTotalUsd,
            createdAt: lead.createdAt,
          },
          configuration: config || null,
          quotes: leadQuotes,
          vehicle: await fetchVehicleForLead(lead.id),
        });
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
