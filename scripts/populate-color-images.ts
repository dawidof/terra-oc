import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql, isNull, inArray } from "drizzle-orm";
import postgres from "postgres";
import {
  configurationOptionGroups,
  configurationOptions,
  carColorImages,
  vehicleMedia,
  trims,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const COLOR_HEX_MAP: Record<string, string> = {
  white: "#F0F0F0", "solid-white": "#F0F0F0", "snow-white": "#FAFAFA", "pearl-white": "#F5F0E8",
  black: "#1A1A1A", "metallic-black": "#2D2D2D", "black-leather": "#1A1A1A", "black-cloth": "#2A2A2A",
  grey: "#8C8C8C", gray: "#8C8C8C", "grey-metallic": "#A0A0A0", "grey-leather": "#6B6B6B",
  "grey-cloth": "#7A7A7A", "matte-grey": "#6E6E6E", "gravel-grey": "#9A9590",
  blue: "#2B4C7E", "ocean-blue": "#1B5E7B", "starry-blue": "#1E3A5F",
  red: "#8B1A1A", "fire-red": "#A52A2A", "fiery-red": "#B22222", "red-leather": "#6B1A1A",
  green: "#2E5A3A", "matte-green": "#3A5A3A",
  beige: "#C8B89A", "beige-leather": "#C8B89A", "beige-cloth": "#B8A88A",
  "orange-interior": "#D4762C",
};

function getHexForColor(code: string | null, name: string): string {
  if (code && COLOR_HEX_MAP[code]) return COLOR_HEX_MAP[code];
  const n = name.toLowerCase();
  if (n.includes("белый") || n.includes("white")) return "#F0F0F0";
  if (n.includes("чёрный") || n.includes("черный") || n.includes("black")) return "#1A1A1A";
  if (n.includes("серый") || n.includes("gray") || n.includes("grey")) return "#8C8C8C";
  if (n.includes("синий") || n.includes("blue")) return "#2B4C7E";
  if (n.includes("красный") || n.includes("red")) return "#8B1A1A";
  if (n.includes("зелён") || n.includes("зелен") || n.includes("green")) return "#2E5A3A";
  if (n.includes("бежевый") || n.includes("beige")) return "#C8B89A";
  if (n.includes("розовый") || n.includes("rose")) return "#B76E79";
  if (n.includes("серебр") || n.includes("silver")) return "#C0C0C0";
  return "#8C8C8C";
}

async function main() {
  // ── Step 1: Update hex codes in batch ──────────────────────────────────
  console.log("=== Step 1: Updating hex codes ===\n");

  const colorOptions = await db
    .select({
      id: configurationOptions.id,
      name: configurationOptions.name,
      code: configurationOptions.code,
      imageUrl: configurationOptions.imageUrl,
    })
    .from(configurationOptions)
    .innerJoin(configurationOptionGroups, eq(configurationOptions.groupId, configurationOptionGroups.id))
    .where(sql`${configurationOptionGroups.type} IN ('exterior_color', 'interior_color')`);

  const needsHex = colorOptions.filter((o) => !o.imageUrl);
  console.log(`${colorOptions.length} total color options, ${needsHex.length} need hex codes`);

  if (needsHex.length > 0) {
    // Batch update using SQL
    const updates = needsHex.map((o) => {
      const hex = getHexForColor(o.code, o.name);
      return sql`UPDATE configuration_options SET image_url = ${hex} WHERE id = ${o.id}`;
    });
    // Execute in chunks of 50
    for (let i = 0; i < updates.length; i += 50) {
      const chunk = updates.slice(i, i + 50);
      await Promise.all(chunk.map((u) => db.execute(u)));
    }
    console.log(`✓ Updated ${needsHex.length} hex codes\n`);
  } else {
    console.log("✓ All hex codes already set\n");
  }

  // ── Step 2: Insert color preview images in batch ───────────────────────
  console.log("=== Step 2: Inserting color preview images ===\n");

  // Get options that already have images
  const existingImageOptions = await db
    .selectDistinct({ colorOptionId: carColorImages.colorOptionId })
    .from(carColorImages);
  const existingSet = new Set(existingImageOptions.map((r) => r.colorOptionId));

  // Get all color options with trim info
  const allOptions = await db
    .select({
      optionId: configurationOptions.id,
      optionName: configurationOptions.name,
      trimId: configurationOptionGroups.trimId,
    })
    .from(configurationOptions)
    .innerJoin(configurationOptionGroups, eq(configurationOptions.groupId, configurationOptionGroups.id))
    .where(sql`${configurationOptionGroups.type} IN ('exterior_color', 'interior_color')`);

  const needingImages = allOptions.filter((o) => !existingSet.has(o.optionId));
  console.log(`${needingImages.length} options need images`);

  // Group by trim
  const trimMap = new Map<string, typeof needingImages>();
  for (const o of needingImages) {
    const list = trimMap.get(o.trimId) || [];
    list.push(o);
    trimMap.set(o.trimId, list);
  }

  let inserted = 0;
  for (const [trimId, options] of trimMap) {
    // Get model version
    const trim = (await db.select({ mvId: trims.modelVersionId }).from(trims).where(eq(trims.id, trimId)).limit(1))[0];
    if (!trim) continue;

    const media = await db.select().from(vehicleMedia).where(eq(vehicleMedia.modelVersionId, trim.mvId)).orderBy(vehicleMedia.sortOrder);
    if (media.length === 0) continue;

    // Build batch values
    const values: { colorOptionId: string; imageUrl: string; alt: string; sortOrder: number }[] = [];
    for (const opt of options) {
      for (let i = 0; i < media.length; i++) {
        values.push({
          colorOptionId: opt.optionId,
          imageUrl: media[i].url,
          alt: `${opt.optionName} — фото ${i + 1}`,
          sortOrder: i,
        });
      }
    }

    // Insert in chunks of 100
    for (let i = 0; i < values.length; i += 100) {
      const chunk = values.slice(i, i + 100);
      await db.insert(carColorImages).values(chunk);
    }

    inserted += values.length;
    console.log(`  ✓ ${trimId.slice(0, 8)}...: ${options.length} colors × ${media.length} imgs = ${values.length} entries`);
  }

  console.log(`\n✅ Done! Inserted ${inserted} color preview image entries.`);
  await client.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
