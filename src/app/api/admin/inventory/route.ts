import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehicleInventory, trims, modelVersions, carModels, brands } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const trimId = searchParams.get("trimId");

  const conditions = [];
  if (status) conditions.push(eq(vehicleInventory.status, status as any));
  if (trimId) conditions.push(eq(vehicleInventory.trimId, trimId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await db
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
    })
    .from(vehicleInventory)
    .innerJoin(trims, eq(vehicleInventory.trimId, trims.id))
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .where(where)
    .orderBy(desc(vehicleInventory.createdAt));

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
    const { trimId, status, location, vin, expectedDate, notes } = body;

    if (!trimId || !status) {
      return NextResponse.json(
        { error: "trimId and status are required" },
        { status: 400 }
      );
    }

    const [item] = await db
      .insert(vehicleInventory)
      .values({
        trimId,
        status,
        location,
        vin,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const [item] = await db
      .update(vehicleInventory)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
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
