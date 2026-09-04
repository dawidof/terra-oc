import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateReview } from "@/lib/admin";
import { reviewUpdateSchema } from "@/lib/validation-schemas";

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

  const parsed = reviewUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await updateReview(id, parsed.data, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Review update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
