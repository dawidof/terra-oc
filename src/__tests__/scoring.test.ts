import { describe, it, expect } from "vitest";

const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
  under_35k: { min: 0, max: 35000 },
  "35k_45k": { min: 35000, max: 45000 },
  "45k_55k": { min: 45000, max: 55000 },
  over_55k: { min: 55000, max: Infinity },
  any: { min: 0, max: Infinity },
};

function scoreBudget(price: number, budget: string) {
  if (budget === "any" || !budget) return { score: 0, reason: null };
  const range = BUDGET_RANGES[budget];
  if (!range) return { score: 0, reason: null };
  if (price >= range.min && price <= range.max) {
    return { score: 30, reason: `Укладывается в бюджет` };
  }
  const tenPercentAbove = range.max * 1.1;
  if (price > range.max && price <= tenPercentAbove) {
    return { score: 15, reason: `Чуть выше бюджета` };
  }
  if (price > tenPercentAbove) {
    return { score: -30, reason: `Значительно выше бюджета` };
  }
  return { score: 0, reason: null };
}

function scorePowertrain(trimPowertrain: string | null, desired: string) {
  if (!desired || desired === "any" || !trimPowertrain) return { score: 0, reason: null };
  if (trimPowertrain === desired) {
    return { score: 20, reason: `Тип привода: ${desired}` };
  }
  return { score: -10, reason: null };
}

function scoreSeats(trimSeats: number | null, desired: string) {
  if (!desired || desired === "any") return { score: 0, exclude: false, reason: null };
  const requiredSeats = Number(desired);
  if (!trimSeats || trimSeats < requiredSeats) {
    return { score: 0, exclude: true, reason: null };
  }
  return { score: 15, exclude: false, reason: `${trimSeats} мест` };
}

function scoreBodyType(trimBodyType: string | null, desired: string) {
  if (!desired || desired === "any" || !trimBodyType) return { score: 0, reason: null };
  const normalized = trimBodyType.toLowerCase();
  const desiredLower = desired.toLowerCase();
  const matchMap: Record<string, string[]> = {
    sedan: ["sedan"],
    suv: ["suv", "crossover"],
    liftback: ["liftback", "sedan"],
  };
  const matches = matchMap[desiredLower]?.some((t) => normalized.includes(t)) || normalized === desiredLower;
  if (matches) return { score: 15, reason: `Тип кузова: ${trimBodyType}` };
  return { score: 0, reason: null };
}

describe("Scoring: Budget", () => {
  it("gives full score when within budget", () => {
    const result = scoreBudget(30000, "under_35k");
    expect(result.score).toBe(30);
    expect(result.reason).toBeTruthy();
  });

  it("gives full score when within budget", () => {
    const result = scoreBudget(38000, "35k_45k");
    expect(result.score).toBe(30);
  });

  it("gives partial score when slightly over budget", () => {
    const result = scoreBudget(46000, "35k_45k");
    expect(result.score).toBe(15);
  });

  it("penalizes when way over budget", () => {
    const result = scoreBudget(60000, "under_35k");
    expect(result.score).toBe(-30);
  });

  it("returns 0 for any budget", () => {
    const result = scoreBudget(100000, "any");
    expect(result.score).toBe(0);
  });

  it("returns 0 for unknown budget", () => {
    const result = scoreBudget(30000, "unknown");
    expect(result.score).toBe(0);
  });
});

describe("Scoring: Powertrain", () => {
  it("gives score when matches", () => {
    const result = scorePowertrain("bev", "bev");
    expect(result.score).toBe(20);
  });

  it("penalizes when mismatched", () => {
    const result = scorePowertrain("petrol", "bev");
    expect(result.score).toBe(-10);
  });

  it("returns 0 for any", () => {
    const result = scorePowertrain("bev", "any");
    expect(result.score).toBe(0);
  });

  it("returns 0 for null trim powertrain", () => {
    const result = scorePowertrain(null, "bev");
    expect(result.score).toBe(0);
  });
});

describe("Scoring: Seats", () => {
  it("gives score when enough seats", () => {
    const result = scoreSeats(7, "5");
    expect(result.score).toBe(15);
    expect(result.exclude).toBe(false);
  });

  it("excludes when not enough seats", () => {
    const result = scoreSeats(4, "7");
    expect(result.exclude).toBe(true);
  });

  it("returns 0 for any", () => {
    const result = scoreSeats(5, "any");
    expect(result.score).toBe(0);
    expect(result.exclude).toBe(false);
  });
});

describe("Scoring: Body Type", () => {
  it("gives score for matching sedan", () => {
    const result = scoreBodyType("sedan", "sedan");
    expect(result.score).toBe(15);
  });

  it("gives score for SUV matching crossover", () => {
    const result = scoreBodyType("crossover", "suv");
    expect(result.score).toBe(15);
  });

  it("returns 0 for mismatch", () => {
    const result = scoreBodyType("sedan", "suv");
    expect(result.score).toBe(0);
  });

  it("returns 0 for any", () => {
    const result = scoreBodyType("sedan", "any");
    expect(result.score).toBe(0);
  });
});
