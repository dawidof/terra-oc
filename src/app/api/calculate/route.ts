import { NextRequest, NextResponse } from "next/server";
import { calculate, type CalculatorInput } from "@/lib/calculator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: CalculatorInput = {
      sourceCountry: body.sourceCountry,
      condition: body.condition,
      purchasePrice: body.purchasePrice,
      currency: body.currency || "USD",
      powertrain: body.powertrain,
      engineDisplacementCc: body.engineDisplacementCc,
      enginePowerHp: body.enginePowerHp,
      motorPowerKw: body.motorPowerKw,
      batteryCapacityKwh: body.batteryCapacityKwh,
      modelYear: body.modelYear,
      trimId: body.trimId,
    };

    const breakdown = await calculate(input);

    if (!breakdown) {
      return NextResponse.json(
        { error: "No calculation rules found for these parameters" },
        { status: 404 }
      );
    }

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error("Calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate" },
      { status: 500 }
    );
  }
}
