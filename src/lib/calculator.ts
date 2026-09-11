import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { calculationRuleVersions, exchangeRates, trims } from "@/db/schema";

export interface CalculatorInput {
  sourceCountry: string;
  condition: "new" | "used";
  purchasePrice: number;
  currency: string;
  powertrain?: "bev" | "phev" | "petrol" | "diesel" | "hev" | "reev";
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
  const now = new Date().toISOString();
  const rules = await db
    .select()
    .from(calculationRuleVersions)
    .where(
      and(
        eq(calculationRuleVersions.country, country),
        eq(calculationRuleVersions.condition, condition),
        eq(calculationRuleVersions.powertrain, powertrain),
        eq(calculationRuleVersions.active, true),
        sql`${calculationRuleVersions.validFrom} <= ${now}::timestamp`,
        sql`(${calculationRuleVersions.validTo} IS NULL OR ${calculationRuleVersions.validTo} >= ${now}::timestamp)`
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
    .orderBy(desc(exchangeRates.recordedAt))
    .limit(1);

  return rates[0] || null;
}

export interface RuleCombination {
  country: string;
  condition: string;
  powertrain: string;
}

export async function getAvailableRuleCombinations(): Promise<RuleCombination[]> {
  const now = new Date().toISOString();
  return db
    .selectDistinct({
      country: calculationRuleVersions.country,
      condition: calculationRuleVersions.condition,
      powertrain: calculationRuleVersions.powertrain,
    })
    .from(calculationRuleVersions)
    .where(
      and(
        eq(calculationRuleVersions.active, true),
        sql`${calculationRuleVersions.validFrom} <= ${now}::timestamp`,
        sql`(${calculationRuleVersions.validTo} IS NULL OR ${calculationRuleVersions.validTo} >= ${now}::timestamp)`
      )
    )
    .orderBy(calculationRuleVersions.country, calculationRuleVersions.condition, calculationRuleVersions.powertrain);
}

export async function calculate(
  input: CalculatorInput
): Promise<CalculationBreakdown | null> {
  let powertrain = input.powertrain;
  let motorPowerKw = input.motorPowerKw;
  let engineDisplacementCc = input.engineDisplacementCc;
  let enginePowerHp = input.enginePowerHp;
  let batteryCapacityKwh = input.batteryCapacityKwh;

  if (input.trimId) {
    const [trim] = await db
      .select({
        powertrainType: trims.powertrainType,
        motorPowerKw: trims.motorPowerKw,
        engineDisplacementCc: trims.engineDisplacementCc,
        enginePowerHp: trims.enginePowerHp,
        batteryCapacityKwh: trims.batteryCapacityKwh,
      })
      .from(trims)
      .where(eq(trims.id, input.trimId))
      .limit(1);

    if (trim) {
      if (!powertrain && trim.powertrainType) {
        powertrain = trim.powertrainType as NonNullable<CalculatorInput["powertrain"]>;
      }
      if (!motorPowerKw && trim.motorPowerKw) {
        motorPowerKw = trim.motorPowerKw;
      }
      if (!engineDisplacementCc && trim.engineDisplacementCc) {
        engineDisplacementCc = trim.engineDisplacementCc;
      }
      if (!enginePowerHp && trim.enginePowerHp) {
        enginePowerHp = trim.enginePowerHp;
      }
      if (!batteryCapacityKwh && trim.batteryCapacityKwh) {
        batteryCapacityKwh = Number(trim.batteryCapacityKwh);
      }
    }
  }

  if (!powertrain) return null;

  const rule = await getActiveRule(
    input.sourceCountry,
    input.condition,
    powertrain
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
  if (powertrain === "petrol" || powertrain === "diesel") {
    if (
      params.exciseThresholdCc &&
      engineDisplacementCc &&
      engineDisplacementCc > params.exciseThresholdCc
    ) {
      exciseTax = (customsValue + customsDuty) * (params.excisePercent / 100);
    }
  } else if (powertrain === "bev" || powertrain === "phev") {
    if (
      params.exciseThresholdKw &&
      motorPowerKw &&
      motorPowerKw > params.exciseThresholdKw
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

  // Round to 2 decimal places to avoid floating point artifacts
  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    vehiclePrice: round(vehiclePriceUsd),
    logistics: params.logistics,
    customsDuty: round(customsDuty),
    exciseTax: round(exciseTax),
    vat: round(vat),
    certificationFees: params.certificationFees,
    serviceFee: params.serviceFee,
    total: round(total),
    currency: "USD",
    ruleVersionId: rule.id,
    formulaVersion: rule.formulaVersion,
    exchangeRate: uzsRate ? round(Number(uzsRate.rate)) : 0,
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
