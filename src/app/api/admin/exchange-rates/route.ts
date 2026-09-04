import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { exchangeRates } from "@/db/schema";
import { sql } from "drizzle-orm";

const FREE_API_URL = "https://open.er-api.com/v6/latest/USD";
const TARGET_CURRENCIES = ["UZS", "CNY", "KRW", "RUB"];

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rates = await db
    .select()
    .from(exchangeRates)
    .orderBy(sql`${exchangeRates.recordedAt} DESC`)
    .limit(20);

  return NextResponse.json({ rates });
}

export async function POST() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(FREE_API_URL);
    if (!res.ok) {
      return NextResponse.json({ error: `API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    if (data.result !== "success") {
      return NextResponse.json({ error: "API returned failure" }, { status: 502 });
    }

    let inserted = 0;
    for (const currency of TARGET_CURRENCIES) {
      if (data.rates[currency]) {
        await db.insert(exchangeRates).values({
          fromCurrency: "USD",
          toCurrency: currency,
          rate: String(data.rates[currency]),
          source: "open.er-api.com",
        });
        inserted++;
      }
    }

    return NextResponse.json({ success: true, updated: inserted });
  } catch (error) {
    console.error("Exchange rate update error:", error);
    return NextResponse.json({ error: "Failed to update rates" }, { status: 500 });
  }
}
