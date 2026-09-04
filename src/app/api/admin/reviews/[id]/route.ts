import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateReview } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const userId = (session.user as any).id;

  try {
    const result = await updateReview(id, body, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Review update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
