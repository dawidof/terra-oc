import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateLeadStatus, assignLead, setFollowUp, updateLeadEstimate } from "@/lib/crm";
import { leadUpdateSchema } from "@/lib/validation-schemas";

export async function PATCH(
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
  const userRole = (session.user as any).role;

  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const data = parsed.data;

  try {
    if (data.status) {
      await updateLeadStatus(id, data.status, userId);
    }

    if (data.assignedManagerId !== undefined) {
      if (userRole !== "admin") {
        return NextResponse.json({ error: "Only admin can assign" }, { status: 403 });
      }
      await assignLead(id, data.assignedManagerId ?? "", userId);
    }

    if ("nextFollowUpAt" in data) {
      await setFollowUp(id, data.nextFollowUpAt ?? null);
    }

    if (data.estimatedTotal !== undefined || data.additionalCosts !== undefined || data.calculatorBreakdown !== undefined) {
      await updateLeadEstimate(
        id,
        data.estimatedTotal ?? null,
        data.additionalCosts ?? null,
        userId,
        data.calculatorBreakdown ?? null
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
