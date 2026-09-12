import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quotes, leads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateLeadStatus } from "@/lib/crm";
import { generateQuotePdf } from "@/lib/quote-pdf";

const QUOTE_STATUSES = ["draft", "sent", "accepted", "expired"] as const;

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    const body = await request.json();
    const { quoteId, status } = body;

    if (!quoteId || !status) {
      return NextResponse.json(
        { error: "quoteId and status are required" },
        { status: 400 }
      );
    }

    if (!QUOTE_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(quotes)
      .where(eq(quotes.id, quoteId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const [quote] = await db
      .update(quotes)
      .set({
        status,
        sentAt: status === "sent" ? new Date() : existing.sentAt,
      })
      .where(eq(quotes.id, quoteId))
      .returning();

    if (status === "sent" && existing.status === "draft") {
      const [lead] = await db
        .select({ status: leads.status })
        .from(leads)
        .where(eq(leads.id, existing.leadId))
        .limit(1);

      const terminalOrLater = ["quote_sent", "negotiation", "won", "lost"];
      if (lead && !terminalOrLater.includes(lead.status)) {
        await updateLeadStatus(existing.leadId, "quote_sent", userId || "");
      }
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error("Failed to update quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leadId, configurationJson } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    // Verify lead exists
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Set validity to 30 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const [quote] = await db
      .insert(quotes)
      .values({
        leadId,
        configurationJson: configurationJson || {},
        status: "draft",
        validUntil,
      })
      .returning();

    let pdfUrl: string | null = null;
    try {
      pdfUrl = await generateQuotePdf(quote.id);
    } catch (error) {
      console.error(`Quote PDF generation failed for ${quote.id}:`, error);
    }

    return NextResponse.json({ quote: pdfUrl ? { ...quote, pdfUrl } : quote });
  } catch (error) {
    console.error("Failed to create quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const quotesList = await db
    .select()
    .from(quotes)
    .where(eq(quotes.leadId, leadId))
    .orderBy(quotes.createdAt);

  return NextResponse.json({ quotes: quotesList });
}
