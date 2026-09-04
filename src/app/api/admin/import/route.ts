import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { brands, carModels, modelVersions, trims, vehicleOffers } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get stats
  const [brandCount] = await db.select({ count: count() }).from(brands);
  const [modelCount] = await db.select({ count: count() }).from(carModels);
  const [trimCount] = await db.select({ count: count() }).from(trims);
  const [offerCount] = await db.select({ count: count() }).from(vehicleOffers);

  return NextResponse.json({
    stats: {
      brands: brandCount.count,
      models: modelCount.count,
      trims: trimCount.count,
      offers: offerCount.count,
    },
  });
}
