import { db } from "../src/db";
import { exchangeRates } from "../src/db/schema";

const FREE_API_URL = "https://open.er-api.com/v6/latest/USD";

interface ExchangeRateResponse {
  result: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}

const TARGET_CURRENCIES = ["UZS", "CNY", "KRW", "RUB"];

async function fetchRates(): Promise<Record<string, number>> {
  console.log("Fetching exchange rates from open.er-api.com...");

  const res = await fetch(FREE_API_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data: ExchangeRateResponse = await res.json();

  if (data.result !== "success") {
    throw new Error("API returned non-success result");
  }

  const rates: Record<string, number> = {};
  for (const currency of TARGET_CURRENCIES) {
    if (data.rates[currency]) {
      rates[currency] = data.rates[currency];
    }
  }

  return rates;
}

async function persistRates(rates: Record<string, number>, source: string) {
  let inserted = 0;

  for (const [toCurrency, rate] of Object.entries(rates)) {
    await db.insert(exchangeRates).values({
      fromCurrency: "USD",
      toCurrency,
      rate: String(rate),
      source,
    });
    inserted++;
    console.log(`  USD/${toCurrency}: ${rate}`);
  }

  return inserted;
}

async function main() {
  console.log("💱 Exchange Rate Updater\n");

  try {
    const rates = await fetchRates();
    const count = await persistRates(rates, "open.er-api.com");

    console.log(`\n✅ Updated ${count} exchange rates`);
  } catch (error) {
    console.error("❌ Failed to fetch exchange rates:", error);
    process.exit(1);
  }
}

main();
