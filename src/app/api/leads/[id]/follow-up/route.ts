import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { completeFollowUp, setFollowUp } from "@/lib/crm";

const actionSchema = z.object({
  action: z.enum(["complete", "reschedule"]),
  days: z.number().int().min(1).max(365).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = actionSchema.safeParse(await request.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (parsed.data.action === "complete") {
      await completeFollowUp(id, (session.user as { id?: string }).id!);
      return NextResponse.json({ success: true });
    }

    const days = parsed.data.days ?? 1;
    const next = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await setFollowUp(id, next.toISOString());
    return NextResponse.json({ success: true, nextFollowUpAt: next.toISOString() });
  } catch (error) {
    console.error("Follow-up action error:", error);
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}
