import { NextRequest, NextResponse } from "next/server";
import { createLead, type LeadInput } from "@/lib/leads";
import { leadSchema } from "@/lib/validation-schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { requireCsrf } from "@/lib/csrf-middleware";

export async function POST(request: NextRequest) {
  const csrf = await requireCsrf(request);
  if (!csrf.ok) {
    return NextResponse.json({ error: csrf.error }, { status: 403 });
  }

  const ip = getClientIp(request);
  const rl = rateLimit(`leads:${ip}`, { windowMs: 60_000, maxRequests: 5 });
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

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Validation error";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const input: LeadInput = {
      name: data.name,
      phone: data.phone,
      telegram: data.telegram,
      whatsapp: data.whatsapp,
      email: data.email || undefined,
      preferredContactMethod: data.preferredContactMethod,
      trimId: data.trimId,
      brandName: data.brandName,
      modelName: data.modelName,
      trimName: data.trimName,
      sourceCountry: data.sourceCountry,
      condition: data.condition,
      configurationJson: data.configurationJson,
      sourcePrice: data.sourcePrice,
      estimatedTotal: data.estimatedTotal,
      currency: data.currency,
      source: data.source || "website",
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      referrer: data.referrer,
      comment: data.comment,
    };

    const lead = await createLead(input);

    return NextResponse.json(
      { success: true, leadId: lead.id },
      {
        headers: {
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
