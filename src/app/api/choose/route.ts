import { NextRequest, NextResponse } from "next/server";
import { getRecommendations, type WizardAnswers } from "@/lib/scoring";
import { chooseSchema } from "@/lib/validation-schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`choose:${ip}`, { windowMs: 60_000, maxRequests: 10 });
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

    const parsed = chooseSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const answers: WizardAnswers = {
      budget: data.budget,
      bodyType: data.bodyType,
      powertrain: data.powertrain,
      seats: data.seats,
      priority: data.priority,
      usage: data.usage,
    };

    const recommendations = await getRecommendations(answers);

    return NextResponse.json(
      { recommendations },
      {
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
