import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateLeadStatus, assignLead, setFollowUp } from "@/lib/crm";

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

  try {
    if (body.status) {
      await updateLeadStatus(id, body.status, userId);
    }

    if (body.assignedManagerId !== undefined) {
      if (userRole !== "admin") {
        return NextResponse.json({ error: "Only admin can assign" }, { status: 403 });
      }
      await assignLead(id, body.assignedManagerId, userId);
    }

    if ("nextFollowUpAt" in body) {
      await setFollowUp(id, body.nextFollowUpAt);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
