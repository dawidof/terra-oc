import { NextRequest, NextResponse } from "next/server";
import { createLead, type LeadInput } from "@/lib/leads";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input: LeadInput = {
      name: body.name,
      phone: body.phone,
      telegram: body.telegram,
      whatsapp: body.whatsapp,
      email: body.email,
      preferredContactMethod: body.preferredContactMethod,
      trimId: body.trimId,
      brandName: body.brandName,
      modelName: body.modelName,
      trimName: body.trimName,
      sourceCountry: body.sourceCountry,
      condition: body.condition,
      configurationJson: body.configurationJson,
      sourcePrice: body.sourcePrice,
      estimatedTotal: body.estimatedTotal,
      currency: body.currency,
      source: body.source || "website",
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      referrer: body.referrer,
      comment: body.comment,
    };

    const lead = await createLead(input);

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
