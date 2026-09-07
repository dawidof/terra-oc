import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import {
  configurationOptionGroups,
  configurationOptions,
  carColorImages,
  trims,
  modelVersions,
  carModels,
  brands,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// ─── CSS color mapping ──────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  "solid-white": "#F5F5F5",
  "white": "#F5F5F5",
  "pearl-white": "#FAF0E6",
  "snow-white": "#FFFAFA",
  "metallic-black": "#1A1A1A",
  "black": "#1A1A1A",
  "matte-grey": "#7B7B7B",
  "grey": "#808080",
  "grey-metallic": "#6B6B6B",
  "gravel-grey": "#696969",
  "ocean-blue": "#1E3A5F",
  "blue": "#2563EB",
  "starry-blue": "#1E40AF",
  "red": "#B22222",
  "fiery-red": "#DC143C",
  "fire-red": "#DC143C",
  "beige-leather": "#D2B48C",
  "beige": "#D2B48C",
  "orange-interior": "#FF8C00",
  "black-leather": "#2C2C2C",
  "red-leather": "#8B0000",
  "black-cloth": "#333333",
  "grey-leather": "#808080",
};

function getColorHex(code: string | null, name: string): string {
  if (code && COLOR_MAP[code]) return COLOR_MAP[code];
  const lower = name.toLowerCase();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return "#CCCCCC";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎨 Seeding color data...\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Add imageUrl (CSS hex) to all color configuration_options
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("─── Step 1: Adding CSS colors to configuration_options ───");

  const colorGroups = await db
    .select()
    .from(configurationOptionGroups)
    .where(
      sql`${configurationOptionGroups.type} IN ('exterior_color', 'interior_color')`
    );

  console.log(`Found ${colorGroups.length} color groups`);

  let updatedCount = 0;
  for (const group of colorGroups) {
    const options = await db
      .select()
      .from(configurationOptions)
      .where(eq(configurationOptions.groupId, group.id));

    for (const opt of options) {
      if (!opt.imageUrl) {
        const hex = getColorHex(opt.code, opt.name);
        await db
          .update(configurationOptions)
          .set({ imageUrl: hex })
          .where(eq(configurationOptions.id, opt.id));
        console.log(`  ✓ ${opt.name} (${opt.code}) → ${hex}`);
        updatedCount++;
      }
    }
  }
  console.log(`Updated ${updatedCount} options with CSS colors\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Build brand/model slug → images lookup
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("─── Step 2: Seeding car_color_images ───");

  const publicImagesDir = path.resolve(__dirname, "../public/images/cars");
  const allFiles = fs.readdirSync(publicImagesDir).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  // Build lookup: group.id → { brandSlug, modelSlug, trimId }
  const groupMeta: Record<string, { brandSlug: string; modelSlug: string; trimId: string }> = {};
  for (const group of colorGroups) {
    const [row] = await db
      .select({
        trimId: trims.id,
        modelSlug: carModels.slug,
        brandSlug: brands.slug,
      })
      .from(trims)
      .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
      .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
      .innerJoin(brands, eq(carModels.brandId, brands.id))
      .where(eq(trims.id, group.trimId))
      .limit(1);

    if (row) {
      groupMeta[group.id] = row;
    }
  }

  // Build lookup: "brand-model" → image filenames
  const modelImageMap: Record<string, string[]> = {};
  for (const file of allFiles) {
    const baseName = file.replace(/\.(jpg|jpeg|png|webp)$/i, "").toLowerCase();
    for (const [, meta] of Object.entries(groupMeta)) {
      const bSlug = meta.brandSlug.toLowerCase();
      const mSlug = meta.modelSlug.toLowerCase();
      if (baseName.includes(bSlug) && baseName.includes(mSlug)) {
        const key = `${bSlug}-${mSlug}`;
        if (!modelImageMap[key]) modelImageMap[key] = [];
        if (!modelImageMap[key].includes(file)) {
          modelImageMap[key].push(file);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Insert car_color_images for each color option
  // ═══════════════════════════════════════════════════════════════════════════
  let imagesSeeded = 0;

  for (const group of colorGroups) {
    const meta = groupMeta[group.id];
    if (!meta) continue;

    const key = `${meta.brandSlug.toLowerCase()}-${meta.modelSlug.toLowerCase()}`;
    const images = modelImageMap[key] || [];

    const options = await db
      .select()
      .from(configurationOptions)
      .where(eq(configurationOptions.groupId, group.id));

    for (const opt of options) {
      const existing = await db
        .select()
        .from(carColorImages)
        .where(eq(carColorImages.colorOptionId, opt.id))
        .limit(1);

      if (existing.length > 0) continue;

      const imagesToAdd = images.length > 0
        ? images.slice(0, 4)
        : allFiles
            .filter((f) => f.toLowerCase().includes(meta.brandSlug.toLowerCase()))
            .slice(0, 3);

      for (let i = 0; i < imagesToAdd.length; i++) {
        await db.insert(carColorImages).values({
          colorOptionId: opt.id,
          imageUrl: `/images/cars/${imagesToAdd[i]}`,
          alt: `${opt.name} — фото ${i + 1}`,
          sortOrder: i,
        });
        imagesSeeded++;
      }

      if (imagesToAdd.length > 0) {
        console.log(`  ✓ ${opt.name}: ${imagesToAdd.length} images`);
      } else {
        console.log(`  ⚠ ${opt.name}: no images found`);
      }
    }
  }

  console.log(`\nSeeded ${imagesSeeded} car_color_images\n`);

  console.log("=".repeat(50));
  console.log("✅ Color seeding complete!");
  console.log(`  CSS colors added: ${updatedCount}`);
  console.log(`  Car color images: ${imagesSeeded}`);
  console.log("=".repeat(50));

  await client.end();
}

main().catch((err) => {
  console.error("Color seeding failed:", err);
  process.exit(1);
});
