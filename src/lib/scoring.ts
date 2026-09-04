import { db } from "@/db";
import { trims, vehicleOffers, carModels, brands, modelVersions } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface WizardAnswers {
  budget?: string;
  bodyType?: string;
  powertrain?: string;
  seats?: string;
  priority?: string;
  usage?: string;
}

export interface ScoredTrim {
  trimId: string;
  trimName: string;
  modelName: string;
  brandName: string;
  modelSlug: string;
  trimSlug: string;
  bodyType: string | null;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  batteryCapacityKwh: string | null;
  seats: number | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
  score: number;
  reasons: string[];
}

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  under_35k: { min: 0, max: 35000 },
  "35k_45k": { min: 35000, max: 45000 },
  "45k_55k": { min: 45000, max: 55000 },
  over_55k: { min: 55000, max: Infinity },
  any: { min: 0, max: Infinity },
};

function scoreBudget(
  price: number,
  budget: string
): { score: number; reason: string | null } {
  if (budget === "any" || !budget) return { score: 0, reason: null };

  const range = BUDGET_RANGES[budget];
  if (!range) return { score: 0, reason: null };

  if (price >= range.min && price <= range.max) {
    return { score: 30, reason: `Укладывается в бюджет ($${range.min.toLocaleString()}–$${range.max.toLocaleString()})` };
  }

  const tenPercentAbove = range.max * 1.1;
  if (price > range.max && price <= tenPercentAbove) {
    return { score: 15, reason: `Чуть выше бюджета (+${Math.round(((price - range.max) / range.max) * 100)}%)` };
  }

  if (price > tenPercentAbove) {
    return { score: -30, reason: `Значительно выше бюджета` };
  }

  return { score: 0, reason: null };
}

function scorePowertrain(
  trimPowertrain: string | null,
  desired: string
): { score: number; reason: string | null } {
  if (!desired || desired === "any" || !trimPowertrain) return { score: 0, reason: null };

  if (trimPowertrain === desired) {
    return { score: 20, reason: `Тип привода: ${desired === "bev" ? "электро" : desired === "phev" ? "гибрид" : trimPowertrain}` };
  }

  return { score: -10, reason: null };
}

function scoreSeats(
  trimSeats: number | null,
  desired: string
): { score: number; exclude: boolean; reason: string | null } {
  if (!desired || desired === "any") return { score: 0, exclude: false, reason: null };

  const requiredSeats = Number(desired);
  if (!trimSeats || trimSeats < requiredSeats) {
    return { score: 0, exclude: true, reason: null };
  }

  return { score: 15, exclude: false, reason: `${trimSeats} мест` };
}

function scoreBodyType(
  trimBodyType: string | null,
  desired: string
): { score: number; reason: string | null } {
  if (!desired || desired === "any" || !trimBodyType) return { score: 0, reason: null };

  const normalized = trimBodyType.toLowerCase();
  const desiredLower = desired.toLowerCase();

  const matchMap: Record<string, string[]> = {
    sedan: ["sedan"],
    suv: ["suv", "crossover"],
    liftback: ["liftback", "sedan"],
  };

  const matches = matchMap[desiredLower]?.some((t) => normalized.includes(t)) || normalized === desiredLower;

  if (matches) {
    return { score: 15, reason: `Тип кузова: ${trimBodyType}` };
  }

  return { score: 0, reason: null };
}

function scorePriority(
  trim: any,
  priority: string,
  allPrices: number[],
  allRanges: number[],
  allAccels: number[]
): { score: number; reason: string | null } {
  if (!priority) return { score: 0, reason: null };

  const price = Number(trim.estimatedTotalUsd) || 0;
  const range = trim.rangeKm || 0;
  const accel = trim.acceleration0100 ? Number(trim.acceleration0100) : 999;

  switch (priority) {
    case "price": {
      if (allPrices.length === 0) return { score: 0, reason: null };
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      const range_ = maxPrice - minPrice || 1;
      const normalized = 1 - (price - minPrice) / range_;
      const score = Math.round(normalized * 15);
      return { score, reason: score > 10 ? "Хорошая цена" : null };
    }
    case "range": {
      if (allRanges.length === 0) return { score: 0, reason: null };
      const maxRange = Math.max(...allRanges);
      if (range >= maxRange * 0.9) {
        return { score: 15, reason: `Запас хода: ${range} км` };
      }
      return { score: 0, reason: null };
    }
    case "performance": {
      if (allAccels.length === 0) return { score: 0, reason: null };
      const minAccel = Math.min(...allAccels);
      if (accel <= minAccel * 1.2) {
        return { score: 15, reason: `Разгон 0–100: ${accel} сек` };
      }
      return { score: 0, reason: null };
    }
    default:
      return { score: 0, reason: null };
  }
}

function scoreUsage(
  trim: any,
  usage: string,
  modelSeats: number | null
): { score: number; reason: string | null } {
  if (!usage) return { score: 0, reason: null };

  switch (usage) {
    case "family": {
      let score = 0;
      const reasons: string[] = [];
      const bodyType = trim.bodyType?.toLowerCase() || "";
      if (bodyType.includes("suv") || bodyType.includes("crossover")) {
        score += 10;
        reasons.push("Кроссовер — удобно для семьи");
      }
      if (modelSeats && modelSeats >= 7) {
        score += 5;
        reasons.push("7 мест");
      }
      return { score: Math.min(score, 15), reason: reasons[0] || null };
    }
    case "long_distance": {
      const range = trim.rangeKm || 0;
      if (range >= 500) {
        return { score: 15, reason: `Запас хода ${range} км` };
      }
      return { score: 0, reason: null };
    }
    case "city": {
      const price = Number(trim.estimatedTotalUsd) || 0;
      if (price < 40000) {
        return { score: 10, reason: "Доступная цена для города" };
      }
      return { score: 0, reason: null };
    }
    case "business": {
      const price = Number(trim.estimatedTotalUsd) || 0;
      if (price >= 45000) {
        return { score: 10, reason: "Премиум сегмент" };
      }
      return { score: 0, reason: null };
    }
    default:
      return { score: 0, reason: null };
  }
}

export async function getRecommendations(answers: WizardAnswers): Promise<ScoredTrim[]> {
  const allTrims = await db
    .select({
      trimId: trims.id,
      trimName: trims.name,
      trimSlug: trims.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      acceleration0100: trims.acceleration0100,
      batteryCapacityKwh: trims.batteryCapacityKwh,
      basePrice: trims.basePrice,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      bodyType: carModels.bodyType,
      brandName: brands.name,
      seats: modelVersions.seats,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .leftJoin(vehicleOffers, eq(trims.id, vehicleOffers.trimId))
    .where(eq(trims.active, true));

  const prices = allTrims
    .map((t) => Number(t.estimatedTotalUsd) || 0)
    .filter((p) => p > 0);
  const ranges = allTrims
    .map((t) => t.rangeKm || 0)
    .filter((r) => r > 0);
  const accels = allTrims
    .map((t) => (t.acceleration0100 ? Number(t.acceleration0100) : 0))
    .filter((a) => a > 0);

  const scored: ScoredTrim[] = [];

  for (const trim of allTrims) {
    const price = Number(trim.estimatedTotalUsd) || Number(trim.basePrice) || 0;
    const reasons: string[] = [];
    let totalScore = 0;

    // Budget
    const budgetResult = scoreBudget(price, answers.budget || "any");
    totalScore += budgetResult.score;
    if (budgetResult.reason) reasons.push(budgetResult.reason);

    // Powertrain
    const powertrainResult = scorePowertrain(trim.powertrainType, answers.powertrain || "any");
    totalScore += powertrainResult.score;
    if (powertrainResult.reason) reasons.push(powertrainResult.reason);

    // Seats
    const seatsResult = scoreSeats(trim.seats, answers.seats || "any");
    if (seatsResult.exclude) continue;
    totalScore += seatsResult.score;
    if (seatsResult.reason) reasons.push(seatsResult.reason);

    // Body type
    const bodyResult = scoreBodyType(trim.bodyType, answers.bodyType || "any");
    totalScore += bodyResult.score;
    if (bodyResult.reason) reasons.push(bodyResult.reason);

    // Priority
    const priorityResult = scorePriority(trim, answers.priority || "", prices, ranges, accels);
    totalScore += priorityResult.score;
    if (priorityResult.reason) reasons.push(priorityResult.reason);

    // Usage
    const usageResult = scoreUsage(trim, answers.usage || "", trim.seats);
    totalScore += usageResult.score;
    if (usageResult.reason) reasons.push(usageResult.reason);

    // Normalize to 0-100
    const normalizedScore = Math.max(0, Math.min(100, Math.round(50 + totalScore)));

    scored.push({
      trimId: trim.trimId,
      trimName: trim.trimName,
      modelName: trim.modelName,
      brandName: trim.brandName,
      modelSlug: trim.modelSlug,
      trimSlug: trim.trimSlug,
      bodyType: trim.bodyType,
      powertrainType: trim.powertrainType,
      drivetrain: trim.drivetrain,
      motorPowerKw: trim.motorPowerKw,
      rangeKm: trim.rangeKm,
      acceleration0100: trim.acceleration0100,
      batteryCapacityKwh: trim.batteryCapacityKwh,
      seats: trim.seats,
      estimatedTotalUsd: trim.estimatedTotalUsd || trim.basePrice,
      imageUrl: null,
      score: normalizedScore,
      reasons: reasons.slice(0, 3),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5);
}
