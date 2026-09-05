import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { carModels, modelVersions, vehicleMedia } from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function main() {
  const updates = [
    { modelSlug: "7x", photos: [
      { name: "zeekr-7x-front.jpg", alt: "Zeekr 7X — вид спереди", type: "exterior" },
      { name: "zeekr-7x-side.jpg", alt: "Zeekr 7X — вид сбоку", type: "exterior" },
    ]},
    { modelSlug: "atto-3", photos: [
      { name: "byd-atto3-front.jpg", alt: "BYD Atto 3 — вид спереди", type: "exterior" },
      { name: "byd-atto3-side.jpg", alt: "BYD Atto 3 — вид сбоку", type: "exterior" },
      { name: "byd-atto3-rear.jpg", alt: "BYD Atto 3 — вид сзади", type: "exterior" },
      { name: "byd-atto3-interior.jpg", alt: "BYD Atto 3 — салон", type: "interior" },
    ]},
    { modelSlug: "han", photos: [
      { name: "byd-han-front.jpg", alt: "BYD Han — вид спереди", type: "exterior" },
      { name: "byd-han-side.jpg", alt: "BYD Han — вид сбоку", type: "exterior" },
      { name: "byd-han-rear.jpg", alt: "BYD Han — вид сзади", type: "exterior" },
      { name: "byd-han-interior.jpg", alt: "BYD Han — салон", type: "interior" },
    ]},
  ];

  for (const { modelSlug, photos } of updates) {
    const model = (await db.select().from(carModels).where(eq(carModels.slug, modelSlug)).limit(1))[0];
    if (!model) { console.log(`⚠ Model not found: ${modelSlug}`); continue; }
    const version = (await db.select().from(modelVersions).where(eq(modelVersions.carModelId, model.id)).limit(1))[0];
    if (!version) { console.log(`⚠ Version not found: ${modelSlug}`); continue; }

    const existing = await db.select().from(vehicleMedia).where(eq(vehicleMedia.modelVersionId, version.id));
    for (const m of existing) await db.delete(vehicleMedia).where(eq(vehicleMedia.id, m.id));

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      await db.insert(vehicleMedia).values({
        modelVersionId: version.id,
        type: p.type,
        url: `/images/cars/${p.name}`,
        alt: p.alt,
        sortOrder: i,
      });
    }
    console.log(`✓ ${modelSlug}: ${photos.length} photos updated`);
  }

  console.log("\n✅ Database updated!");
  await client.end();
}

main().catch(console.error);
