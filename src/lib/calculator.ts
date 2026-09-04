import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { calculationRuleVersions, exchangeRates } from "@/db/schema";

export interface CalculatorInput {
  sourceCountry: string;
  condition: "new" | "used";
  purchasePrice: number;
  currency: string;
  powertrain: "bev" | "phev" | "petrol" | "diesel" | "hev" | "reev";
  engineDisplacementCc?: number;
  enginePowerHp?: number;
  motorPowerKw?: number;
  batteryCapacityKwh?: number;
  modelYear?: number;
  trimId?: string;
}

export interface CalculationBreakdown {
  vehiclePrice: number;
  logistics: number;
  customsDuty: number;
  exciseTax: number;
  vat: number;
  certificationFees: number;
  serviceFee: number;
  total: number;
  currency: string;
  ruleVersionId: string;
  formulaVersion: string;
  exchangeRate: number;
  exchangeRateSource: string;
}

async function getActiveRule(
  country: string,
  condition: string,
  powertrain: string
) {
  const now = new Date();
  const rules = await db
    .select()
    .from(calculationRuleVersions)
    .where(
      and(
        eq(calculationRuleVersions.country, country),
        eq(calculationRuleVersions.condition, condition),
        eq(calculationRuleVersions.powertrain, powertrain),
        eq(calculationRuleVersions.active, true),
        sql`${calculationRuleVersions.validFrom} <= ${now}`,
        sql`(${calculationRuleVersions.validTo} IS NULL OR ${calculationRuleVersions.validTo} >= ${now})`
      )
    )
    .orderBy(sql`${calculationRuleVersions.createdAt} DESC`)
    .limit(1);

  return rules[0] || null;
}

async function getExchangeRate(fromCurrency: string, toCurrency: string) {
  const rates = await db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      )
    )
    .orderBy(sql`${exchangeRates.recordedAt} DESC`)
    .limit(1);

  return rates[0] || null;
}

export async function calculate(
  input: CalculatorInput
): Promise<CalculationBreakdown | null> {
  const rule = await getActiveRule(
    input.sourceCountry,
    input.condition,
    input.powertrain
  );

  if (!rule) return null;

  const params = rule.parametersJson as {
    logistics: number;
    customsDutyPercent: number;
    excisePercent: number;
    exciseThresholdCc?: number;
    exciseThresholdKw?: number;
    vatPercent: number;
    certificationFees: number;
    serviceFee: number;
  };

  // Convert to USD if needed
  let vehiclePriceUsd = input.purchasePrice;
  if (input.currency !== "USD") {
    const rate = await getExchangeRate(input.currency, "USD");
    if (rate) {
      vehiclePriceUsd = input.purchasePrice * Number(rate.rate);
    }
  }

  // Customs value = vehicle price + logistics
  const customsValue = vehiclePriceUsd + params.logistics;

  // Customs duty
  const customsDuty = customsValue * (params.customsDutyPercent / 100);

  // Excise tax (for petrol/diesel with large engines, or high-power EVs)
  let exciseTax = 0;
  if (input.powertrain === "petrol" || input.powertrain === "diesel") {
    if (
      params.exciseThresholdCc &&
      input.engineDisplacementCc &&
      input.engineDisplacementCc > params.exciseThresholdCc
    ) {
      exciseTax = (customsValue + customsDuty) * (params.excisePercent / 100);
    }
  } else if (input.powertrain === "bev" || input.powertrain === "phev") {
    if (
      params.exciseThresholdKw &&
      input.motorPowerKw &&
      input.motorPowerKw > params.exciseThresholdKw
    ) {
      exciseTax = (customsValue + customsDuty) * (params.excisePercent / 100);
    }
  }

  // VAT = (customs value + duty + excise) * vatPercent
  const vatBase = customsValue + customsDuty + exciseTax;
  const vat = vatBase * (params.vatPercent / 100);

  const total =
    vehiclePriceUsd +
    params.logistics +
    customsDuty +
    exciseTax +
    vat +
    params.certificationFees +
    params.serviceFee;

  // Get UZS exchange rate for display
  const uzsRate = await getExchangeRate("USD", "UZS");

  return {
    vehiclePrice: vehiclePriceUsd,
    logistics: params.logistics,
    customsDuty,
    exciseTax,
    vat,
    certificationFees: params.certificationFees,
    serviceFee: params.serviceFee,
    total,
    currency: "USD",
    ruleVersionId: rule.id,
    formulaVersion: rule.formulaVersion,
    exchangeRate: uzsRate ? Number(uzsRate.rate) : 0,
    exchangeRateSource: uzsRate?.source || "",
  };
}

export async function getCalculationRuleVersions() {
  return db
    .select()
    .from(calculationRuleVersions)
    .where(eq(calculationRuleVersions.active, true))
    .orderBy(calculationRuleVersions.country, calculationRuleVersions.powertrain);
}

export async function getExchangeRates() {
  return db
    .select()
    .from(exchangeRates)
    .orderBy(sql`${exchangeRates.recordedAt} DESC`)
    .limit(10);
}
