import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addNote } from "@/lib/crm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const userId = (session.user as any).id;

  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Note body required" }, { status: 400 });
  }

  try {
    const note = await addNote(id, userId, body.body.trim());
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("Add note error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
