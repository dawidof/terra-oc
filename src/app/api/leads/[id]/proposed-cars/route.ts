import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leadProposedCars, leadActivities, leads, trims, modelVersions, carModels, brands, vehicleOffers, vehicleMedia, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const rows = await db
    .select({
      id: leadProposedCars.id,
      trimId: leadProposedCars.trimId,
      status: leadProposedCars.status,
      notes: leadProposedCars.notes,
      createdAt: leadProposedCars.createdAt,
      trimName: trims.name,
      trimSlug: trims.slug,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      brandSlug: brands.slug,
      powertrainType: trims.powertrainType,
      drivetrain: trims.drivetrain,
      enginePowerHp: trims.enginePowerHp,
      motorPowerKw: trims.motorPowerKw,
      rangeKm: trims.rangeKm,
      estimatedTotalUsd: vehicleOffers.estimatedTotalUsd,
      imageUrl: vehicleMedia.url,
      addedByName: users.name,
    })
    .from(leadProposedCars)
    .innerJoin(trims, eq(leadProposedCars.trimId, trims.id))
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .leftJoin(
      vehicleOffers,
      and(eq(vehicleOffers.trimId, trims.id), eq(vehicleOffers.active, true))
    )
    .leftJoin(
      vehicleMedia,
      and(
        eq(vehicleMedia.modelVersionId, modelVersions.id),
        eq(vehicleMedia.type, "exterior"),
        eq(vehicleMedia.sortOrder, 0)
      )
    )
    .leftJoin(users, eq(leadProposedCars.addedBy, users.id))
    .where(eq(leadProposedCars.leadId, id))
    .orderBy(desc(leadProposedCars.createdAt));

  return NextResponse.json({ cars: rows });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await request.json();

  if (!body.trimId || typeof body.trimId !== "string") {
    return NextResponse.json({ error: "trimId is required" }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(leadProposedCars)
    .where(and(eq(leadProposedCars.leadId, id), eq(leadProposedCars.trimId, body.trimId)))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Автомобиль уже добавлен" }, { status: 409 });
  }

  const [row] = await db
    .insert(leadProposedCars)
    .values({
      leadId: id,
      trimId: body.trimId,
      addedBy: userId,
    })
    .returning();

  await db.insert(leadActivities).values({
    leadId: id,
    userId,
    type: "proposed_car_added",
    metadataJson: { trimId: body.trimId },
  });

  return NextResponse.json({ success: true, id: row.id });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await request.json();

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  await db
    .update(leadProposedCars)
    .set(updates)
    .where(and(eq(leadProposedCars.id, body.id), eq(leadProposedCars.leadId, id)));

  if (body.status) {
    await db.insert(leadActivities).values({
      leadId: id,
      userId,
      type: "proposed_car_status_changed",
      metadataJson: { proposedCarId: body.id, newStatus: body.status },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await request.json();

  if (!body.id || typeof body.id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db
    .delete(leadProposedCars)
    .where(and(eq(leadProposedCars.id, body.id), eq(leadProposedCars.leadId, id)));

  await db.insert(leadActivities).values({
    leadId: id,
    userId,
    type: "proposed_car_removed",
    metadataJson: { proposedCarId: body.id },
  });

  return NextResponse.json({ success: true });
}
