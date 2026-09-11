import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { updateSiteSetting } from "@/lib/admin";

export async function GET() {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as { role?: string }).role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await db
    .select()
    .from(siteSettings)
    .orderBy(asc(siteSettings.key));

  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as { role?: string }).role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const userId = (session.user as { id: string }).id;

  if (!body.key || body.value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }

  try {
    const result = await updateSiteSetting(body.key, body.value, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
