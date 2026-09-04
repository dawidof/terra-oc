import { NextRequest, NextResponse } from "next/server";
import { createLead, type LeadInput } from "@/lib/leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: LeadInput = {
      name: body.name,
      phone: body.phone,
      telegram: body.telegram,
      preferredContactMethod: body.preferredContactMethod,
      source: "selector",
      comment: body.comment
        ? `Подбор автомобиля. ${body.comment}`
        : "Подбор автомобиля",
    };

    const lead = await createLead(input);

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("Selector lead creation error:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
