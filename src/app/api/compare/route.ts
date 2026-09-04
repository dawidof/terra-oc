import { NextRequest, NextResponse } from "next/server";
import { getComparisonVehicle, getComparisonSpecs } from "@/lib/compare";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const carsParam = searchParams.get("cars");

  if (!carsParam) {
    return NextResponse.json({ vehicles: [], specs: [] });
  }

  const slugs = carsParam.split(",").filter(Boolean).slice(0, 4);

  try {
    const vehicles = await Promise.all(
      slugs.map((slug) => getComparisonVehicle(slug))
    );

    const validVehicles = vehicles.filter(Boolean);
    const trimIds = validVehicles.map((v) => v!.trimId);

    const specs = await getComparisonSpecs(trimIds);

    return NextResponse.json({ vehicles: validVehicles, specs });
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
