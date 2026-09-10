import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import {
  configurationOptionGroups,
  configurationOptions,
  carColorImages,
  vehicleMedia,
  trims,
  modelVersions,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

function classifyPixel(r: number, g: number, b: number): string | null {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const brightness = (r + g + b) / 3;
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (brightness < 30 || brightness > 240) return null;
  if (saturation < 0.1) {
    if (brightness > 200) return "white";
    if (brightness < 60) return "black";
    return "grey";
  }

  let hue = 0;
  if (max === r) hue = ((g - b) / (max - min) + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / (max - min) + 2) * 60;
  else hue = ((r - g) / (max - min) + 4) * 60;
  if (hue < 0) hue += 360;

  if (hue < 20 || hue >= 340) return "red";
  if (hue < 45) return "orange";
  if (hue < 70) return "beige";
  if (hue < 160) return "green";
  return "blue";
}

async function analyzeImageColor(imagePath: string): Promise<string | null> {
  if (!fs.existsSync(imagePath)) return null;

  let buffer: Buffer;
  try {
    buffer = await sharp(imagePath).resize(100, 100, { fit: "cover" }).raw().toBuffer();
  } catch {
    return null;
  }

  const w = 100;
  const colorCounts: Record<string, number> = {};
  let total = 0;

  for (let y = 20; y < 80; y++) {
    for (let x = 20; x < 80; x++) {
      const idx = (y * w + x) * 3;
      const color = classifyPixel(buffer[idx], buffer[idx + 1], buffer[idx + 2]);
      if (color) {
        colorCounts[color] = (colorCounts[color] || 0) + 1;
        total++;
      }
    }
  }

  if (total < 50) return null;

  let best = "";
  let bestCount = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }

  return bestCount / total > 0.2 ? best : null;
}

const FAMILY_TO_OPTION: Record<string, string[]> = {
  white: ["white", "snow-white", "pearl-white", "solid-white"],
  black: ["black", "metallic-black"],
  grey: ["grey", "grey-metallic", "gravel-grey", "matte-grey", "grey-cloth", "grey-leather"],
  red: ["red", "fiery-red", "fire-red", "red-leather"],
  blue: ["blue", "ocean-blue", "starry-blue"],
  green: ["green", "matte-green"],
  beige: ["beige", "beige-leather", "beige-cloth"],
  orange: ["orange-interior"],
};

function findBestOption(
  family: string,
  options: { id: string; code: string; name: string }[]
) {
  const preferred = FAMILY_TO_OPTION[family] || [];
  for (const code of preferred) {
    const match = options.find((o) => o.code === code);
    if (match) return match;
  }
  // Fallback: partial name match
  const terms: Record<string, string[]> = {
    white: ["белый", "white"],
    black: ["чёрный", "черный", "black"],
    grey: ["серый", "grey", "gray"],
    red: ["красный", "red"],
    blue: ["синий", "blue"],
    green: ["зелён", "green"],
    beige: ["бежев", "beige"],
    orange: ["оранжев", "orange"],
  };
  for (const term of terms[family] || []) {
    const match = options.find(
      (o) => o.code.includes(term) || o.name.toLowerCase().includes(term)
    );
    if (match) return match;
  }
  return null;
}

async function main() {
  console.log("=== Color Detection Script ===\n");

  // Load vehicle media
  const mediaRows = await db
    .select({
      id: vehicleMedia.id,
      url: vehicleMedia.url,
      alt: vehicleMedia.alt,
      type: vehicleMedia.type,
      modelVersionId: vehicleMedia.modelVersionId,
    })
    .from(vehicleMedia);
  console.log(`Loaded ${mediaRows.length} media entries`);

  // Load color options with model info
  const colorOptionRows = await db
    .select({
      id: configurationOptions.id,
      code: configurationOptions.code,
      name: configurationOptions.name,
      groupId: configurationOptions.groupId,
      groupType: configurationOptionGroups.type,
      modelVersionId: trims.modelVersionId,
    })
    .from(configurationOptions)
    .innerJoin(configurationOptionGroups, eq(configurationOptions.groupId, configurationOptionGroups.id))
    .innerJoin(trims, eq(configurationOptionGroups.trimId, trims.id))
    .where(sql`${configurationOptionGroups.type} IN ('exterior_color', 'interior_color')`);
  console.log(`Loaded ${colorOptionRows.length} color options`);

  // Group media by model_version
  const mediaByMV = new Map<string, typeof mediaRows>();
  for (const row of mediaRows) {
    if (!mediaByMV.has(row.modelVersionId)) mediaByMV.set(row.modelVersionId, []);
    mediaByMV.get(row.modelVersionId)!.push(row);
  }

  // Group color options by model_version + group_type
  const colorByMV = new Map<string, typeof colorOptionRows>();
  for (const row of colorOptionRows) {
    const key = `${row.modelVersionId}:${row.groupType}`;
    if (!colorByMV.has(key)) colorByMV.set(key, []);
    colorByMV.get(key)!.push(row);
  }

  // Clear existing
  console.log("\nClearing car_color_images...");
  await db.delete(carColorImages);

  // Analyze and map
  console.log("Analyzing images...\n");
  let inserted = 0;
  let skipped = 0;
  const results: { model: string; color: string; images: string[] }[] = [];

  for (const [mvId, mediaList] of mediaByMV) {
    const mv = await db
      .select({ name: modelVersions.name })
      .from(modelVersions)
      .where(eq(modelVersions.id, mvId))
      .limit(1);
    if (!mv.length) continue;
    const modelName = mv[0].name;

    for (const groupType of ["exterior_color", "interior_color"]) {
      const colorOpts = colorByMV.get(`${mvId}:${groupType}`) || [];
      if (colorOpts.length === 0) continue;

      const matchingMedia = mediaList.filter((m) =>
        groupType === "exterior_color" ? m.type === "exterior" : m.type === "interior"
      );
      if (matchingMedia.length === 0) continue;

      // Detect colors per image
      const byFamily = new Map<string, typeof mediaList>();
      for (const media of matchingMedia) {
        const fullPath = path.resolve(
          process.cwd(),
          "public",
          media.url.startsWith("/") ? media.url.slice(1) : media.url
        );
        const family = await analyzeImageColor(fullPath);
        if (family) {
          if (!byFamily.has(family)) byFamily.set(family, []);
          byFamily.get(family)!.push(media);
        }
      }

      // Map families to options
      for (const [family, mediaItems] of byFamily) {
        const opt = findBestOption(family, colorOpts);
        if (!opt) {
          skipped += mediaItems.length;
          continue;
        }

        for (let i = 0; i < mediaItems.length; i++) {
          await db.insert(carColorImages).values({
            colorOptionId: opt.id,
            imageUrl: mediaItems[i].url,
            alt: mediaItems[i].alt || `${opt.name} - photo ${i + 1}`,
            sortOrder: i,
          });
          inserted++;
        }

        const existing = results.find((r) => r.model === modelName && r.color === opt.name);
        if (existing) {
          existing.images.push(...mediaItems.map((m) => m.url));
        } else {
          results.push({
            model: modelName,
            color: `${opt.name} (${opt.code})`,
            images: mediaItems.map((m) => m.url),
          });
        }
      }
    }
  }

  console.log("=== Results ===\n");
  for (const r of results) {
    console.log(`${r.model} → ${r.color}:`);
    for (const img of r.images) console.log(`  ${img}`);
  }

  console.log(`\nInserted: ${inserted} | Skipped: ${skipped}`);
  await client.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
