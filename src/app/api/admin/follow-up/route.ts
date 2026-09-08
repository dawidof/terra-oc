import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  checkFollowUps,
  getOverdueFollowUps,
  getFollowUpRules,
} from "@/lib/follow-up-scheduler";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const overdueLeads = await getOverdueFollowUps();
    const rules = await getFollowUpRules();

    const enabledRules = rules.filter((r) => r.enabled);

    return NextResponse.json({
      overdue: overdueLeads.length,
      pending: enabledRules.length,
      completed: 0,
      rules: enabledRules,
    });
  } catch (error) {
    console.error("Failed to get follow-up stats:", error);
    return NextResponse.json(
      { error: "Failed to get follow-up stats" },
      { status: 500 }
    );
  }
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await checkFollowUps();
    const overdueLeads = await getOverdueFollowUps();

    return NextResponse.json({
      message: `Checked follow-ups. Found ${result.overdue} overdue, sent ${result.notified} notifications.`,
      stats: {
        overdue: overdueLeads.length,
        pending: result.overdue,
        completed: result.notified,
      },
    });
  } catch (error) {
    console.error("Failed to check follow-ups:", error);
    return NextResponse.json(
      { error: "Failed to check follow-ups" },
      { status: 500 }
    );
  }
}
