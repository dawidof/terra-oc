import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { importUrls } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const urls = await db.select().from(importUrls).orderBy(importUrls.createdAt);
  return NextResponse.json({ urls });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { urls } = body as { urls: string[] };

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls array is required" }, { status: 400 });
  }

  const inserted = [];
  for (const url of urls) {
    const trimmed = url.trim();
    if (!trimmed) continue;

    // Determine source site
    let sourceSite = "unknown";
    if (trimmed.includes("gonzo-motors.uz")) sourceSite = "gonzo-motors.uz";
    else if (trimmed.includes("auto.uz")) sourceSite = "auto.uz";
    else if (trimmed.includes("ncars.group")) sourceSite = "ncars.group";

    const [row] = await db.insert(importUrls).values({
      url: trimmed,
      sourceSite,
      status: "pending",
    }).returning();

    inserted.push(row);
  }

  return NextResponse.json({ inserted: inserted.length, urls: inserted });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clearAll = searchParams.get("clearAll") === "true";

  if (clearAll) {
    await db.delete(importUrls);
    return NextResponse.json({ cleared: true });
  }

  if (!id) {
    return NextResponse.json({ error: "id or clearAll param required" }, { status: 400 });
  }

  await db.delete(importUrls).where(eq(importUrls.id, id));
  return NextResponse.json({ deleted: id });
}
