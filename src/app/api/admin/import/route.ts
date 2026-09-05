import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { brands, carModels, trims, vehicleOffers, importUrls } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [brandCount] = await db.select({ count: count() }).from(brands);
  const [modelCount] = await db.select({ count: count() }).from(carModels);
  const [trimCount] = await db.select({ count: count() }).from(trims);
  const [offerCount] = await db.select({ count: count() }).from(vehicleOffers);

  // Count URLs from database
  const [dbUrlCount] = await db.select({ count: count() }).from(importUrls);

  // Count raw JSON files
  const rawDir = path.join(process.cwd(), "data", "raw");
  let rawCount = 0;
  if (fs.existsSync(rawDir)) {
    rawCount = fs
      .readdirSync(rawDir)
      .filter((f) => f.endsWith(".json")).length;
  }

  return NextResponse.json({
    stats: {
      brands: brandCount.count,
      models: modelCount.count,
      trims: trimCount.count,
      offers: offerCount.count,
    },
    urlCount: dbUrlCount.count,
    rawCount,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case "scrape": {
        const result = execSync("pnpm import:scrape", {
          cwd: process.cwd(),
          encoding: "utf-8",
          timeout: 300_000,
        });
        return NextResponse.json({ success: true, output: result });
      }
      case "validate": {
        const rawDir = path.join(process.cwd(), "data", "raw");
        if (!fs.existsSync(rawDir)) {
          return NextResponse.json({ error: "No raw data found. Run scrape first." }, { status: 400 });
        }
        const files = fs.readdirSync(rawDir).filter((f) => f.endsWith(".json"));
        let totalErrors = 0;
        let totalWarnings = 0;
        const issues: { file: string; errors: string[]; warnings: string[] }[] = [];

        for (const file of files) {
          const data = JSON.parse(fs.readFileSync(path.join(rawDir, file), "utf-8"));
          const fileIssues = { file, errors: [] as string[], warnings: [] as string[] };
          if (!data.brand) fileIssues.errors.push("Missing brand");
          if (!data.model) fileIssues.errors.push("Missing model");
          if (!data.trims || data.trims.length === 0) fileIssues.errors.push("No trims");
          totalErrors += fileIssues.errors.length;
          totalWarnings += fileIssues.warnings.length;
          if (fileIssues.errors.length > 0 || fileIssues.warnings.length > 0) {
            issues.push(fileIssues);
          }
        }

        return NextResponse.json({ success: true, files: files.length, totalErrors, totalWarnings, issues });
      }
      case "persist": {
        const result = execSync("pnpm import:persist", {
          cwd: process.cwd(),
          encoding: "utf-8",
          timeout: 300_000,
        });
        return NextResponse.json({ success: true, output: result });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
