import { describe, it, expect } from "vitest";

interface CalculationParams {
  logistics: number;
  customsDutyPercent: number;
  excisePercent: number;
  exciseThresholdCc?: number;
  exciseThresholdKw?: number;
  vatPercent: number;
  certificationFees: number;
  serviceFee: number;
}

interface CalculateInput {
  vehiclePriceUsd: number;
  powertrain: string;
  engineDisplacementCc?: number;
  motorPowerKw?: number;
  params: CalculationParams;
}

interface CalculationResult {
  vehiclePrice: number;
  logistics: number;
  customsDuty: number;
  exciseTax: number;
  vat: number;
  certificationFees: number;
  serviceFee: number;
  total: number;
}

function calculateBreakdown(input: CalculateInput): CalculationResult {
  const { vehiclePriceUsd, powertrain, engineDisplacementCc, motorPowerKw, params } = input;

  const customsValue = vehiclePriceUsd + params.logistics;
  const customsDuty = customsValue * (params.customsDutyPercent / 100);

  let exciseTax = 0;
  if (powertrain === "petrol" || powertrain === "diesel") {
    if (params.exciseThresholdCc && engineDisplacementCc && engineDisplacementCc > params.exciseThresholdCc) {
      exciseTax = (customsValue + customsDuty) * (params.excisePercent / 100);
    }
  } else if (powertrain === "bev" || powertrain === "phev") {
    if (params.exciseThresholdKw && motorPowerKw && motorPowerKw > params.exciseThresholdKw) {
      exciseTax = (customsValue + customsDuty) * (params.excisePercent / 100);
    }
  }

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

  return {
    vehiclePrice: vehiclePriceUsd,
    logistics: params.logistics,
    customsDuty,
    exciseTax,
    vat,
    certificationFees: params.certificationFees,
    serviceFee: params.serviceFee,
    total,
  };
}

const UZB_PARAMS: CalculationParams = {
  logistics: 3000,
  customsDutyPercent: 15,
  excisePercent: 10,
  exciseThresholdCc: 2000,
  exciseThresholdKw: 75,
  vatPercent: 15,
  certificationFees: 500,
  serviceFee: 1000,
};

describe("Calculator", () => {
  it("calculates BEV without excise (low power)", () => {
    const result = calculateBreakdown({
      vehiclePriceUsd: 30000,
      powertrain: "bev",
      motorPowerKw: 60,
      params: UZB_PARAMS,
    });

    expect(result.vehiclePrice).toBe(30000);
    expect(result.logistics).toBe(3000);
    expect(result.customsDuty).toBe(4950); // (30000+3000) * 0.15
    expect(result.exciseTax).toBe(0); // 60kW < 75kW threshold
    expect(result.certificationFees).toBe(500);
    expect(result.serviceFee).toBe(1000);

    const expectedVat = (33000 + 4950 + 0) * 0.15;
    expect(result.vat).toBeCloseTo(expectedVat, 2);

    const expectedTotal = 30000 + 3000 + 4950 + 0 + expectedVat + 500 + 1000;
    expect(result.total).toBeCloseTo(expectedTotal, 2);
  });

  it("calculates BEV with excise (high power)", () => {
    const result = calculateBreakdown({
      vehiclePriceUsd: 45000,
      powertrain: "bev",
      motorPowerKw: 150,
      params: UZB_PARAMS,
    });

    expect(result.customsDuty).toBe(7200); // (45000+3000) * 0.15

    const exciseBase = 48000 + 7200;
    const expectedExcise = exciseBase * 0.10;
    expect(result.exciseTax).toBeCloseTo(expectedExcise, 2);
  });

  it("calculates petrol with excise (large engine)", () => {
    const result = calculateBreakdown({
      vehiclePriceUsd: 35000,
      powertrain: "petrol",
      engineDisplacementCc: 2500,
      params: UZB_PARAMS,
    });

    expect(result.customsDuty).toBe(5700); // (35000+3000) * 0.15

    const exciseBase = 38000 + 5700;
    const expectedExcise = exciseBase * 0.10;
    expect(result.exciseTax).toBeCloseTo(expectedExcise, 2);
  });

  it("calculates petrol without excise (small engine)", () => {
    const result = calculateBreakdown({
      vehiclePriceUsd: 25000,
      powertrain: "petrol",
      engineDisplacementCc: 1500,
      params: UZB_PARAMS,
    });

    expect(result.customsDuty).toBe(4200);
    expect(result.exciseTax).toBe(0); // 1500cc < 2000cc threshold
  });

  it("returns zero excise for unknown powertrain", () => {
    const result = calculateBreakdown({
      vehiclePriceUsd: 30000,
      powertrain: "hev",
      params: UZB_PARAMS,
    });

    expect(result.exciseTax).toBe(0);
  });

  it("total is always positive", () => {
    const result = calculateBreakdown({
      vehiclePriceUsd: 10000,
      powertrain: "bev",
      motorPowerKw: 30,
      params: UZB_PARAMS,
    });

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(result.vehiclePrice);
  });
});
