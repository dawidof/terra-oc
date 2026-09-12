import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehicleInventory, leads, leadActivities } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id?: string };

  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const [vehicle] = await db
      .select({ id: vehicleInventory.id, reservedBy: vehicleInventory.reservedBy })
      .from(vehicleInventory)
      .where(eq(vehicleInventory.id, id))
      .limit(1);

    if (!vehicle) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    if (vehicle.reservedBy) {
      return NextResponse.json({ error: "Автомобиль уже забронирован" }, { status: 409 });
    }

    const [lead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    const [updated] = await db
      .update(vehicleInventory)
      .set({
        reservedBy: leadId,
        reservedAt: new Date(),
        status: "reserved",
        updatedAt: new Date(),
      })
      .where(eq(vehicleInventory.id, id))
      .returning();

    await db.insert(leadActivities).values({
      leadId,
      userId: user.id || null,
      type: "vehicle_reserved",
      metadataJson: { vehicleId: id },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Failed to reserve vehicle:", error);
    return NextResponse.json({ error: "Ошибка бронирования" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id?: string };

  try {
    const [vehicle] = await db
      .select({ id: vehicleInventory.id, reservedBy: vehicleInventory.reservedBy, status: vehicleInventory.status })
      .from(vehicleInventory)
      .where(eq(vehicleInventory.id, id))
      .limit(1);

    if (!vehicle) {
      return NextResponse.json({ error: "Автомобиль не найден" }, { status: 404 });
    }

    if (!vehicle.reservedBy) {
      return NextResponse.json({ error: "Автомобиль не забронирован" }, { status: 409 });
    }

    const previousStatus = vehicle.status === "reserved" ? "on_order" : vehicle.status;
    const leadId = vehicle.reservedBy;

    const [updated] = await db
      .update(vehicleInventory)
      .set({
        reservedBy: null,
        reservedAt: null,
        status: previousStatus,
        updatedAt: new Date(),
      })
      .where(eq(vehicleInventory.id, id))
      .returning();

    await db.insert(leadActivities).values({
      leadId,
      userId: user.id || null,
      type: "vehicle_unreserved",
      metadataJson: { vehicleId: id },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Failed to unreserve vehicle:", error);
    return NextResponse.json({ error: "Ошибка отмены бронирования" }, { status: 500 });
  }
}
