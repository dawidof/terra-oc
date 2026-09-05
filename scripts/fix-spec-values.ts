import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";
import { generateSlug } from "../src/lib/normalizer";
import {
  specificationGroups,
  specificationDefinitions,
  trimSpecificationValues,
  trims,
  modelVersions,
  carModels,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const DATA_DIR = path.join(process.cwd(), "data", "raw");

interface SpecRow {
  __specName: string;
  [key: string]: string;
}

async function main() {
  console.log("🔧 Fixing spec values...\n");

  // 1. Load scraped data
  const rawPath = path.join(DATA_DIR, "zeekr-7x.json");
  const raw = JSON.parse(fs.readFileSync(rawPath, "utf-8"));
  const specGroups: Record<string, SpecRow[]> = raw.specGroups;

  console.log("Scraped spec groups:", Object.keys(specGroups).join(", "));
  console.log("Total specs:", Object.values(specGroups).flat().length, "\n");

  // 2. Get existing DB trims for Zeekr 7X
  const models = await db.select().from(carModels).where(eq(carModels.slug, "7x"));
  if (models.length === 0) { console.error("No 7x model found"); process.exit(1); }
  const versions = await db.select().from(modelVersions).where(eq(modelVersions.carModelId, models[0].id));
  if (versions.length === 0) { console.error("No versions found"); process.exit(1); }
  const dbTrims = await db.select().from(trims).where(eq(trims.modelVersionId, versions[0].id));
  console.log("DB trims:", dbTrims.map(t => `${t.name} (id:${t.id})`).join(", "), "\n");

  // 3. Map scraped trims to DB trims by price
  const scrapedTrims = raw.trims;
  const trimMapping: { dbTrim: typeof dbTrims[0]; scrapedTrim: typeof scrapedTrims[0]; index: number }[] = [];

  // Sort scraped by price, sort DB by price
  const sortedScraped = [...scrapedTrims].sort((a, b) => Number(a.price) - Number(b.price));
  const sortedDb = [...dbTrims].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));

  // Map by price proximity (skip DB trims with no matching scraped)
  for (const s of sortedScraped) {
    let bestDb = null;
    let bestDiff = Infinity;
    for (const d of sortedDb) {
      if (trimMapping.some(m => m.dbTrim.id === d.id)) continue;
      const diff = Math.abs(Number(d.basePrice) - Number(s.price));
      if (diff < bestDiff) {
        bestDiff = diff;
        bestDb = d;
      }
    }
    if (bestDb) {
      const idx = scrapedTrims.indexOf(s);
      trimMapping.push({ dbTrim: bestDb, scrapedTrim: s, index: idx });
    }
  }

  console.log("Trim mapping:");
  for (const m of trimMapping) {
    console.log(`  ${m.dbTrim.name} ($${m.dbTrim.basePrice}) ← ${m.scrapedTrim.name} ($${m.scrapedTrim.price})`);
  }
  console.log();

  // 4. Clean up old definitions and spec values
  const oldGroups = await db.select().from(specificationGroups);
  const oldGroupIds = oldGroups.map(g => g.id);
  if (oldGroupIds.length > 0) {
    const oldDefs = await db.select().from(specificationDefinitions).where(inArray(specificationDefinitions.groupId, oldGroupIds));
    const oldDefIds = oldDefs.map(d => d.id);
    if (oldDefIds.length > 0) {
      await db.delete(trimSpecificationValues).where(inArray(trimSpecificationValues.specificationDefinitionId, oldDefIds));
      await db.delete(specificationDefinitions).where(inArray(specificationDefinitions.id, oldDefIds));
    }
    await db.delete(specificationGroups).where(inArray(specificationGroups.id, oldGroupIds));
    console.log(`Cleaned up ${oldDefs.length} definitions and ${oldGroups.length} groups\n`);
  }

  // 5. Create groups and definitions from scraped data
  let groupOrder = 0;
  let totalDefs = 0;
  let totalValues = 0;

  for (const [groupName, rows] of Object.entries(specGroups)) {
    const groupSlug = generateSlug(groupName);

    // Upsert group
    await db.insert(specificationGroups).values({
      name: groupName,
      slug: groupSlug,
      sortOrder: groupOrder++,
    }).onConflictDoNothing();
    const [group] = await db.select().from(specificationGroups).where(eq(specificationGroups.slug, groupSlug));
    if (!group) { console.error(`Failed to create group ${groupName}`); continue; }
    console.log(`Group: ${groupName} (id:${group.id})`);

    let defOrder = 0;
    for (const row of rows) {
      const specName = row["__specName"];
      if (!specName) continue;

      const specSlug = generateSlug(specName);

      // Upsert definition
      await db.insert(specificationDefinitions).values({
        groupId: group.id,
        name: specName,
        slug: specSlug,
        dataType: "text",
        comparisonPriority: defOrder++,
        filterable: false,
      }).onConflictDoNothing();
      const [def] = await db.select().from(specificationDefinitions).where(eq(specificationDefinitions.slug, specSlug));
      if (!def) { console.error(`Failed to create def ${specName}`); continue; }
      totalDefs++;

      // Delete any existing values for this def+trims combination
      const trimIds = trimMapping.map(m => m.dbTrim.id);
      if (trimIds.length > 0) {
        await db.delete(trimSpecificationValues).where(
          eq(trimSpecificationValues.specificationDefinitionId, def.id)
        );
      }

      // Insert values for each mapped trim
      const valuesToInsert = [];
      for (const m of trimMapping) {
        const value = row[`col_${m.index}`] || null;
        if (value && value !== "+" && value !== "-" && value !== "—") {
          valuesToInsert.push({
            trimId: m.dbTrim.id,
            specificationDefinitionId: def.id,
            valueText: value,
          });
        }
      }

      if (valuesToInsert.length > 0) {
        await db.insert(trimSpecificationValues).values(valuesToInsert);
        totalValues += valuesToInsert.length;
      }
    }
    console.log(`  Created ${rows.length} definitions`);
  }

  console.log(`\n✅ Done! Created ${totalDefs} definitions, inserted ${totalValues} values\n`);

  // Verify
  const valCount = await db.select().from(trimSpecificationValues);
  console.log(`Verification: ${valCount.length} total spec values in DB`);

  await client.end();
}

main().catch(console.error);
