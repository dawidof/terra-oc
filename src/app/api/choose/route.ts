import { NextRequest, NextResponse } from "next/server";
import { getRecommendations, type WizardAnswers } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const answers: WizardAnswers = {
      budget: body.budget,
      bodyType: body.bodyType,
      powertrain: body.powertrain,
      seats: body.seats,
      priority: body.priority,
      usage: body.usage,
    };

    const recommendations = await getRecommendations(answers);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Scoring error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
