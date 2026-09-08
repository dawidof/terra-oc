import { NextResponse } from "next/server";
import { db } from "@/db";
import { exchangeRates } from "@/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

export async function GET() {
  try {
    // Check if we have a recent rate (less than 1 hour old)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [recentRate] = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromCurrency, "USD"),
          eq(exchangeRates.toCurrency, "UZS"),
          gte(exchangeRates.recordedAt, oneHourAgo)
        )
      )
      .orderBy(desc(exchangeRates.recordedAt))
      .limit(1);

    if (recentRate) {
      return NextResponse.json({
        rate: Number(recentRate.rate),
        source: recentRate.source,
        recordedAt: recentRate.recordedAt,
        cached: true,
      });
    }

    // Fetch from free API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data: ExchangeRateResponse = await response.json();
    const uzsRate = data.rates["UZS"];

    if (!uzsRate) {
      throw new Error("UZS rate not found in response");
    }

    // Store in database
    await db.insert(exchangeRates).values({
      fromCurrency: "USD",
      toCurrency: "UZS",
      rate: String(uzsRate),
      source: "exchangerate-api.com",
      recordedAt: new Date(),
    });

    return NextResponse.json({
      rate: uzsRate,
      source: "exchangerate-api.com",
      recordedAt: new Date(),
      cached: false,
    });
  } catch (error) {
    console.error("Exchange rate fetch error:", error);

    // Try to get any stored rate as fallback
    const [fallbackRate] = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromCurrency, "USD"),
          eq(exchangeRates.toCurrency, "UZS")
        )
      )
      .orderBy(desc(exchangeRates.recordedAt))
      .limit(1);

    if (fallbackRate) {
      return NextResponse.json({
        rate: Number(fallbackRate.rate),
        source: fallbackRate.source,
        recordedAt: fallbackRate.recordedAt,
        cached: true,
        fallback: true,
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Manual refresh endpoint
  try {
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data: ExchangeRateResponse = await response.json();
    const uzsRate = data.rates["UZS"];

    if (!uzsRate) {
      throw new Error("UZS rate not found in response");
    }

    await db.insert(exchangeRates).values({
      fromCurrency: "USD",
      toCurrency: "UZS",
      rate: String(uzsRate),
      source: "exchangerate-api.com (manual)",
      recordedAt: new Date(),
    });

    return NextResponse.json({
      rate: uzsRate,
      source: "exchangerate-api.com",
      recordedAt: new Date(),
    });
  } catch (error) {
    console.error("Manual exchange rate refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh exchange rate" },
      { status: 500 }
    );
  }
}
