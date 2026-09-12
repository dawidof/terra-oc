import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, customers, leadActivities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { notifyClientMessage } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = rateLimit(`portal-message:${ip}`, { windowMs: 60_000, maxRequests: 5 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { leadId, message } = body;

    if (!leadId || !message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Укажите текст сообщения" },
        { status: 400 }
      );
    }

    const trimmed = message.trim();
    if (trimmed.length < 2 || trimmed.length > 500) {
      return NextResponse.json(
        { error: "Сообщение должно быть от 2 до 500 символов" },
        { status: 400 }
      );
    }

    const [lead] = await db
      .select({
        id: leads.id,
        customerName: customers.name,
      })
      .from(leads)
      .innerJoin(customers, eq(leads.customerId, customers.id))
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    await db.insert(leadActivities).values({
      leadId,
      userId: null,
      type: "client_message",
      metadataJson: { message: trimmed },
    });

    void notifyClientMessage({
      leadId,
      customerName: lead.customerName,
      message: trimmed,
    }).catch((error) => {
      console.error("notifyClientMessage failed:", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portal message error:", error);
    return NextResponse.json({ error: "Ошибка отправки сообщения" }, { status: 500 });
  }
}
