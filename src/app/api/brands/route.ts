import { NextResponse } from "next/server";
import { getAllBrands } from "@/lib/queries";

export const revalidate = 300;

export async function GET() {
  const brands = await getAllBrands();
  return NextResponse.json({
    brands: brands.map((b) => ({ slug: b.slug, name: b.name })),
  });
}
