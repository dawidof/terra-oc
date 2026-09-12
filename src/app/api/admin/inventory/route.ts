import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehicleInventory, trims, modelVersions, carModels, brands, leads, customers } from "@/db/schema";
import { eq, and, desc, isNull, isNotNull, or, ilike } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const trimId = searchParams.get("trimId");
  const excludeReserved = searchParams.get("excludeReserved") === "true";
  const reservedOnly = searchParams.get("reservedOnly") === "true";
  const q = searchParams.get("q");

  const conditions = [];
  if (status) conditions.push(eq(vehicleInventory.status, status as any));
  if (trimId) conditions.push(eq(vehicleInventory.trimId, trimId));
  if (excludeReserved) conditions.push(isNull(vehicleInventory.reservedBy));
  if (reservedOnly) conditions.push(isNotNull(vehicleInventory.reservedBy));
  if (q) {
    const term = `%${q}%`;
    conditions.push(
      or(
        ilike(brands.name, term),
        ilike(carModels.name, term),
        ilike(trims.name, term),
        ilike(vehicleInventory.vin, term)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: vehicleInventory.id,
      trimId: vehicleInventory.trimId,
      status: vehicleInventory.status,
      location: vehicleInventory.location,
      vin: vehicleInventory.vin,
      expectedDate: vehicleInventory.expectedDate,
      reservedBy: vehicleInventory.reservedBy,
      reservedAt: vehicleInventory.reservedAt,
      notes: vehicleInventory.notes,
      createdAt: vehicleInventory.createdAt,
      // Trim info
      trimName: trims.name,
      trimSlug: trims.slug,
      basePrice: trims.basePrice,
      powertrainType: trims.powertrainType,
      // Model info
      modelName: carModels.name,
      modelSlug: carModels.slug,
      // Brand info
      brandName: brands.name,
      brandSlug: brands.slug,
      // Reserved lead info
      reservedLeadId: leads.id,
      reservedCustomerName: customers.name,
      reservedCustomerPhone: customers.phone,
      reservedJourneyStage: leads.journeyStage,
    })
    .from(vehicleInventory)
    .innerJoin(trims, eq(vehicleInventory.trimId, trims.id))
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .leftJoin(leads, eq(vehicleInventory.reservedBy, leads.id))
    .leftJoin(customers, eq(leads.customerId, customers.id))
    .where(where)
    .orderBy(desc(vehicleInventory.createdAt));

  const items = q ? await query.limit(20) : await query;

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { trimId, status, location, vin, expectedDate, notes, reservedBy } = body;

    if (!trimId || !status) {
      return NextResponse.json(
        { error: "trimId and status are required" },
        { status: 400 }
      );
    }

    const finalStatus = reservedBy ? "reserved" : status;

    const [item] = await db
      .insert(vehicleInventory)
      .values({
        trimId,
        status: finalStatus,
        location,
        vin,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        reservedBy: reservedBy || null,
        reservedAt: reservedBy ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to create inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, location, vin, expectedDate, notes, reservedBy } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const setFields: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) setFields.status = status;
    if (location !== undefined) setFields.location = location;
    if (vin !== undefined) setFields.vin = vin;
    if (expectedDate !== undefined) setFields.expectedDate = expectedDate ? new Date(expectedDate) : null;
    if (notes !== undefined) setFields.notes = notes;

    if (reservedBy !== undefined) {
      if (reservedBy) {
        const [lead] = await db
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.id, reservedBy))
          .limit(1);
        if (!lead) {
          return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
        }
      }
      setFields.reservedBy = reservedBy || null;
      setFields.reservedAt = reservedBy ? new Date() : null;
      if (reservedBy) {
        setFields.status = "reserved";
      } else if (status === undefined) {
        const [current] = await db
          .select({ status: vehicleInventory.status })
          .from(vehicleInventory)
          .where(eq(vehicleInventory.id, id))
          .limit(1);
        if (current?.status === "reserved") {
          setFields.status = "on_order";
        }
      }
    }

    const [item] = await db
      .update(vehicleInventory)
      .set(setFields)
      .where(eq(vehicleInventory.id, id))
      .returning();

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Failed to update inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db
      .delete(vehicleInventory)
      .where(eq(vehicleInventory.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete inventory item" },
      { status: 500 }
    );
  }
}
