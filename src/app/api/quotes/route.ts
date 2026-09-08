import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { quotes, leads } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    return NextResponse.json({ quote });
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
