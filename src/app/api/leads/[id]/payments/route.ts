import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leadPayments } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const payments = await db
    .select()
    .from(leadPayments)
    .where(eq(leadPayments.leadId, id))
    .orderBy(asc(leadPayments.sortOrder), asc(leadPayments.createdAt));

  return NextResponse.json({ payments });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { label, amount, currency, dueDate, paid } = body;

    if (!label || amount === undefined || amount === null || Number.isNaN(Number(amount))) {
      return NextResponse.json(
        { error: "label and amount are required" },
        { status: 400 }
      );
    }

    const payments = await db
      .select({ sortOrder: leadPayments.sortOrder })
      .from(leadPayments)
      .where(eq(leadPayments.leadId, id));

    const nextSortOrder = payments.length
      ? Math.max(...payments.map((p) => p.sortOrder)) + 1
      : 0;

    const [payment] = await db
      .insert(leadPayments)
      .values({
        leadId: id,
        label,
        amount: String(amount),
        currency: currency || "USD",
        dueDate: dueDate ? new Date(dueDate) : null,
        paidAt: paid ? new Date() : null,
        sortOrder: nextSortOrder,
      })
      .returning();

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json({ error: "Ошибка создания платежа" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { paymentId, label, amount, dueDate, paid } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const setFields: Record<string, unknown> = {};
    if (label !== undefined) setFields.label = label;
    if (amount !== undefined) setFields.amount = String(amount);
    if (dueDate !== undefined) setFields.dueDate = dueDate ? new Date(dueDate) : null;
    if (paid !== undefined) setFields.paidAt = paid ? new Date() : null;

    const [payment] = await db
      .update(leadPayments)
      .set(setFields)
      .where(and(eq(leadPayments.id, paymentId), eq(leadPayments.leadId, id)))
      .returning();

    if (!payment) {
      return NextResponse.json({ error: "Платёж не найден" }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Failed to update payment:", error);
    return NextResponse.json({ error: "Ошибка обновления платежа" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get("paymentId");

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
  }

  await db
    .delete(leadPayments)
    .where(and(eq(leadPayments.id, paymentId), eq(leadPayments.leadId, id)));

  return NextResponse.json({ success: true });
}
