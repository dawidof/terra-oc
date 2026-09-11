import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { assignLead, updateLeadStatus } from "@/lib/crm";

const bulkSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Не выбраны заявки").max(200),
  status: z
    .enum([
      "new",
      "assigned",
      "contacted",
      "needs_follow_up",
      "qualified",
      "quote_sent",
      "negotiation",
      "won",
      "lost",
    ])
    .optional(),
  assignedManagerId: z.string().uuid().optional(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role?: string }).role;

  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { ids, status, assignedManagerId } = parsed.data;

  if (!status && !assignedManagerId) {
    return NextResponse.json(
      { error: "Укажите статус или менеджера" },
      { status: 400 }
    );
  }

  if (assignedManagerId && userRole !== "admin") {
    return NextResponse.json(
      { error: "Only admin can assign" },
      { status: 403 }
    );
  }

  try {
    let updated = 0;
    for (const id of ids) {
      if (status) {
        await updateLeadStatus(id, status, userId);
        updated++;
      }
      if (assignedManagerId) {
        await assignLead(id, assignedManagerId, userId);
        if (!status) updated++;
      }
    }
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: "Failed to update leads" }, { status: 500 });
  }
}
