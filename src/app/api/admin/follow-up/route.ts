import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  checkFollowUps,
  getOverdueFollowUps,
  getFollowUpRules,
  saveFollowUpRules,
} from "@/lib/follow-up-scheduler";
import { logAudit } from "@/lib/admin";

const FOLLOW_UP_RULES_AUDIT_ID = "f26fa998-c155-4894-a916-438865cdfd6a";

function hasCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user && !hasCronSecret(request)) {
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
      rules,
    });
  } catch (error) {
    console.error("Failed to get follow-up stats:", error);
    return NextResponse.json(
      { error: "Failed to get follow-up stats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const viaCron = !session?.user && hasCronSecret(request);

  if (!session?.user && !viaCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session?.user) {
    const user = session.user as { role?: string };
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id || "";
  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const before = await getFollowUpRules();
    const rules = await saveFollowUpRules(body.rules);

    await logAudit(userId, "site_settings", FOLLOW_UP_RULES_AUDIT_ID, "update", before, rules);

    return NextResponse.json({ rules });
  } catch (error) {
    const message =
      error instanceof Error && error.message === "Invalid follow-up rules"
        ? "Invalid follow-up rules"
        : "Failed to save follow-up rules";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
