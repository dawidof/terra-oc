import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import type { RawVehicleData } from "../src/lib/normalizer";
import { generateSlug, normalizeSpecs } from "../src/lib/normalizer";
import { validateVehicle } from "../src/lib/validator";
import {
  brands,
  carModels,
  modelVersions,
  trims,
  vehicleOffers,
  vehicleMedia,
  specificationGroups,
  specificationDefinitions,
  trimSpecificationValues,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const DATA_DIR = path.join(process.cwd(), "data", "raw");

// ─── Upsert helper ───────────────────────────────────────────────────
async function upsert(table: any, data: any, conflictTarget: any) {
  const [row] = await db.insert(table).values(data).onConflictDoNothing({ target: conflictTarget }).returning();
  if (row) return row;
  return (await db.select().from(table).where(eq(conflictTarget, data[Object.keys(conflictTarget)[0]])).limit(1))[0];
}

// ─── Ensure helpers (from seed.ts pattern) ───────────────────────────
async function ensureBrand(name: string, slug: string, country: string, description: string) {
  let brand = (await db.select().from(brands).where(eq(brands.slug, slug)).limit(1))[0];
  if (!brand) {
    [brand] = await db.insert(brands).values({ name, slug, country, description }).returning();
    console.log(`    + Created brand: ${name}`);
  }
  return brand;
}

async function ensureModel(brandId: string, name: string, slug: string, bodyType: string, shortDescription: string) {
  let model = (await db.select().from(carModels).where(eq(carModels.slug, slug)).limit(1))[0];
  if (!model) {
    [model] = await db.insert(carModels).values({ brandId, name, slug, bodyType: bodyType || "SUV", shortDescription }).returning();
    console.log(`    + Created model: ${name}`);
  }
  return model;
}

async function ensureVersion(carModelId: string, name: string, sourceCountry: string) {
  let version = (await db.select().from(modelVersions).where(eq(modelVersions.carModelId, carModelId)).limit(1))[0];
  if (!version) {
    [version] = await db.insert(modelVersions).values({
      carModelId,
      name,
      generationCode: name,
      modelYearFrom: 2024,
      productionStatus: "production",
      defaultSourceCountry: sourceCountry,
      seats: 5,
      doors: 5,
    }).returning();
    console.log(`    + Created version: ${name}`);
  }
  return version;
}

async function ensureTrim(modelVersionId: string, trimData: any) {
  const existing = (await db.select().from(trims).where(eq(trims.slug, trimData.slug)).limit(1))[0];
  if (existing) {
    console.log(`    ≈ Trim exists: ${trimData.name}`);
    return existing;
  }

  const [trim] = await db.insert(trims).values({
    modelVersionId,
    name: trimData.name,
    slug: trimData.slug,
    powertrainType: trimData.powertrainType || "bev",
    drivetrain: trimData.drivetrain || "RWD",
    engineDisplacementCc: trimData.engineDisplacementCc,
    enginePowerHp: trimData.enginePowerHp,
    motorPowerKw: trimData.motorPowerKw,
    batteryCapacityKwh: trimData.batteryCapacityKwh ? String(trimData.batteryCapacityKwh) : null,
    rangeKm: trimData.rangeKm,
    acceleration0100: trimData.acceleration0100 ? String(trimData.acceleration0100) : null,
    basePrice: trimData.basePrice || "0",
    basePriceCurrency: trimData.priceCurrency || "USD",
  }).returning();
  console.log(`    + Created trim: ${trimData.name}`);
  return trim;
}

async function ensureOffer(trimId: string, trimData: any, sourceCountry: string) {
  const existing = (await db.select().from(vehicleOffers).where(eq(vehicleOffers.trimId, trimId)).limit(1))[0];
  if (existing) {
    console.log(`    ≈ Offer exists for trim`);
    return existing;
  }

  const logistics = "3000";
  const customs = "4500";
  const serviceFee = "1500";
  const basePrice = Number(trimData.basePrice) || 0;
  const total = basePrice + Number(logistics) + Number(customs) + Number(serviceFee);

  const [offer] = await db.insert(vehicleOffers).values({
    trimId,
    sourceCountry,
    condition: "new",
    modelYear: 2024,
    sourcePrice: String(basePrice),
    sourceCurrency: trimData.priceCurrency || "USD",
    priceBasis: trimData.priceBasis || "CIF",
    estimatedLogistics: logistics,
    estimatedCustoms: customs,
    estimatedServiceFee: serviceFee,
    estimatedTotalUsd: String(total),
    deliveryDays: 25,
  }).returning();
  console.log(`    + Created offer: $${basePrice}`);
  return offer;
}

function loadAllRawData(): RawVehicleData[] {
  if (!fs.existsSync(DATA_DIR)) {
    console.log(`❌ Raw data directory not found: ${DATA_DIR}`);
    console.log("Run 'pnpm import:scrape' first to scrape vehicle data.");
    process.exit(1);
  }

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const vehicles: RawVehicleData[] = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawVehicleData;
      vehicles.push(data);
    } catch (err) {
      console.error(`⚠ Failed to parse ${file}: ${(err as Error).message}`);
    }
  }

  return vehicles;
}

async function main() {
  console.log("🚀 TerraAuto Vehicle Importer\n");

  const vehicles = loadAllRawData();
  console.log(`📋 Found ${vehicles.length} vehicles to import\n`);

  if (vehicles.length === 0) {
    console.log("No raw data found. Run 'pnpm import:scrape' first.");
    process.exit(0);
  }

  // ─── Validate ────────────────────────────────────────────────────────
  console.log("🔍 Validating data...");
  let hasErrors = false;

  for (const vehicle of vehicles) {
    const validation = validateVehicle(vehicle);
    if (!validation.isValid) {
      hasErrors = true;
      console.log(`\n❌ ${vehicle.brand} ${vehicle.model}:`);
      for (const issue of validation.issues.filter((i) => i.severity === "error")) {
        console.log(`   • ${issue.message}`);
      }
    }
  }

  if (hasErrors) {
    console.log("\n⚠ Some vehicles have validation errors.");
    console.log("Import will continue but may create incomplete records.\n");
  }

  // ─── Import ──────────────────────────────────────────────────────────
  console.log("\n📦 Importing vehicles...\n");

  let imported = 0;
  let skipped = 0;

  for (const vehicle of vehicles) {
    console.log(`\n🚗 ${vehicle.brand} ${vehicle.model}`);

    try {
      // Ensure brand
      const brandSlug = generateSlug(vehicle.brand);
      const brand = await ensureBrand(
        vehicle.brand,
        brandSlug,
        "Китай",
        `Автомобили ${vehicle.brand}`
      );

      // Ensure model
      const modelSlug = generateSlug(vehicle.model);
      const firstTrim = vehicle.trims[0];
      const bodyType = firstTrim?.bodyType || "SUV";
      const model = await ensureModel(
        brand.id,
        vehicle.model,
        modelSlug,
        bodyType,
        `${vehicle.brand} ${vehicle.model}`
      );

      // Ensure version
      const version = await ensureVersion(model.id, "2024", "Китай");

      // Ensure trims
      const trimRecords = [];
      for (const trimData of vehicle.trims) {
        const trimSlug = generateSlug(`${vehicle.brand}-${vehicle.model}-${trimData.name}`);
        const trim = await ensureTrim(version.id, {
          ...trimData,
          slug: trimSlug,
        });

        // Ensure offer
        await ensureOffer(trim.id, trimData, "Китай");
        trimRecords.push({ trim, trimData });
      }

      // Import specification groups, definitions, and values
      if (vehicle.specGroups && Object.keys(vehicle.specGroups).length > 0) {
        console.log(`    📊 Importing specifications...`);
        let specGroupOrder = 0;

        for (const [groupName, rows] of Object.entries(vehicle.specGroups)) {
          // Ensure spec group
          const groupSlug = generateSlug(groupName);
          let specGroup = (await db.select().from(specificationGroups).where(eq(specificationGroups.slug, groupSlug)).limit(1))[0];
          if (!specGroup) {
            [specGroup] = await db.insert(specificationGroups).values({
              name: groupName,
              slug: groupSlug,
              sortOrder: specGroupOrder,
            }).returning();
          }
          specGroupOrder++;

          // Process each spec row
          for (const row of rows) {
            const specName = row["__specName"];
            if (!specName) continue;

            const specSlug = generateSlug(specName);

            // Ensure spec definition
            let specDef = (await db.select().from(specificationDefinitions).where(eq(specificationDefinitions.slug, specSlug)).limit(1))[0];
            if (!specDef) {
              [specDef] = await db.insert(specificationDefinitions).values({
                groupId: specGroup.id,
                name: specName,
                slug: specSlug,
                dataType: "text",
                comparisonPriority: 50,
                filterable: false,
              }).returning();
            }

            // Batch insert values for all trims at once
            const valuesToInsert = [];
            for (let i = 0; i < trimRecords.length; i++) {
              const { trim, trimData } = trimRecords[i];
              const value = row[trimData.name] || row[`col_${i}`] || null;
              if (value && value !== "+" && value !== "-" && value !== "—") {
                valuesToInsert.push({
                  trimId: trim.id,
                  specificationDefinitionId: specDef.id,
                  valueText: value,
                });
              }
            }

            if (valuesToInsert.length > 0) {
              await db.insert(trimSpecificationValues).values(valuesToInsert).onConflictDoNothing();
            }
          }
        }
        console.log(`    ✓ Specifications imported`);
      }

      // Add media placeholder if none exists
      const existingMedia = await db.select().from(vehicleMedia).where(eq(vehicleMedia.modelVersionId, version.id));
      const allImages = vehicle.trims.flatMap((t) => t.imageUrls);
      if (existingMedia.length === 0 && allImages.length > 0) {
        await db.insert(vehicleMedia).values({
          modelVersionId: version.id,
          type: "exterior",
          url: allImages[0],
          alt: `${vehicle.brand} ${vehicle.model}`,
        });
      }

      imported++;
      console.log(`  ✓ Imported with ${vehicle.trims.length} trims`);
    } catch (err) {
      skipped++;
      console.error(`  ❌ Failed: ${(err as Error).message}`);
    }
  }

  // ─── Summary ─────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(50));
  console.log("📊 Import Summary");
  console.log("=".repeat(50));
  console.log(`Total vehicles: ${vehicles.length}`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => client.end());
