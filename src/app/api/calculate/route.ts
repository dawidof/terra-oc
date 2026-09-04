import { NextRequest, NextResponse } from "next/server";
import { calculate, type CalculatorInput } from "@/lib/calculator";
import { calculateSchema } from "@/lib/validation-schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`calculate:${ip}`, { windowMs: 60_000, maxRequests: 20 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const body = await request.json();

    const parsed = calculateSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const input: CalculatorInput = {
      sourceCountry: data.sourceCountry,
      condition: data.condition,
      purchasePrice: data.purchasePrice,
      currency: data.currency,
      powertrain: data.powertrain,
      engineDisplacementCc: data.engineDisplacementCc,
      enginePowerHp: data.enginePowerHp,
      motorPowerKw: data.motorPowerKw,
      batteryCapacityKwh: data.batteryCapacityKwh,
      modelYear: data.modelYear,
      trimId: data.trimId,
    };

    const breakdown = await calculate(input);

    if (!breakdown) {
      return NextResponse.json(
        { error: "No calculation rules found for these parameters" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { breakdown },
      {
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate" },
      { status: 500 }
    );
  }
}
