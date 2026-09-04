import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateTrimField, updateOfferField } from "@/lib/admin";

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
    if (body.trimField !== undefined) {
      await updateTrimField(id, body.trimField, body.value, userId);
    } else if (body.offerField !== undefined) {
      await updateOfferField(id, body.offerField, body.value, userId);
    } else {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Vehicle update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
