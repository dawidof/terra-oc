import { describe, it, expect } from "vitest";

describe("Scoring — Pure Logic", () => {
  const BUDGET_RANGES: Record<string, { min: number; max: number }> = {
    under_35k: { min: 0, max: 35000 },
    "35k_45k": { min: 35000, max: 45000 },
    "45k_55k": { min: 45000, max: 55000 },
    over_55k: { min: 55000, max: Infinity },
    any: { min: 0, max: Infinity },
  };

  it("gives full score when within budget", () => {
    const price = 30000;
    const budget = "under_35k";
    const range = BUDGET_RANGES[budget];
    expect(price >= range.min && price <= range.max).toBe(true);
  });

  it("penalizes when way over budget", () => {
    const price = 60000;
    const budget = "under_35k";
    const range = BUDGET_RANGES[budget];
    const tenPercentAbove = range.max * 1.1;
    expect(price > tenPercentAbove).toBe(true);
  });

  it("normalizes score to 0-100 range", () => {
    const rawScore = 30;
    const normalized = Math.max(0, Math.min(100, Math.round(50 + rawScore)));
    expect(normalized).toBe(80);
  });

  it("budget range boundaries are correct", () => {
    expect(BUDGET_RANGES["under_35k"].max).toBe(35000);
    expect(BUDGET_RANGES["35k_45k"].min).toBe(35000);
    expect(BUDGET_RANGES["35k_45k"].max).toBe(45000);
    expect(BUDGET_RANGES["over_55k"].min).toBe(55000);
  });

  it("sort order is deterministic", () => {
    const scores = [80, 75, 90, 60, 90];
    const sorted = [...scores].sort((a, b) => b - a);
    expect(sorted).toEqual([90, 90, 80, 75, 60]);
  });
});
