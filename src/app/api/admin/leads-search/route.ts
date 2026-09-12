import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, customers, leadConfigurations } from "@/db/schema";
import { eq, or, ilike, desc } from "drizzle-orm";

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ leads: [] });
  }

  const searchTerm = `%${q}%`;
  const searchDigits = normalizePhone(q);

  const allCustomers = await db
    .select({ id: customers.id, phone: customers.phone, name: customers.name })
    .from(customers);

  const matchingCustomerIds = allCustomers
    .filter((c) => {
      const byName = c.name?.toLowerCase().includes(q.toLowerCase());
      const byPhone = c.phone && normalizePhone(c.phone).includes(searchDigits);
      return byName || byPhone;
    })
    .map((c) => c.id);

  if (matchingCustomerIds.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const results = await db
    .select({
      id: leads.id,
      status: leads.status,
      createdAt: leads.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
      trimName: leadConfigurations.trimName,
      brandName: leadConfigurations.brandName,
      modelName: leadConfigurations.modelName,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(leadConfigurations, eq(leads.id, leadConfigurations.leadId))
    .where(
      matchingCustomerIds.length === 1
        ? eq(leads.customerId, matchingCustomerIds[0])
        : or(...matchingCustomerIds.map((id) => eq(leads.customerId, id)))
    )
    .orderBy(desc(leads.createdAt))
    .limit(10);

  return NextResponse.json({ leads: results });
}
