import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuditLogs } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType") || undefined;
  const entityId = searchParams.get("entityId") || undefined;
  const limit = Number(searchParams.get("limit")) || 50;

  try {
    const logs = await getAuditLogs({ entityType, entityId, limit });
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
