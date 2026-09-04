import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateSiteSetting } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const userId = (session.user as any).id;

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
