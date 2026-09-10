import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, asc, sql } from "drizzle-orm";
import postgres from "postgres";
import { trims, modelVersions, carModels, brands, vehicleOffers, vehicleMedia } from "../src/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  const result = await db
    .selectDistinctOn([carModels.id], {
      modelId: carModels.id,
      modelName: carModels.name,
      modelSlug: carModels.slug,
      brandName: brands.name,
      trimSlug: trims.slug,
      trimName: trims.name,
      imageUrl: vehicleMedia.url,
    })
    .from(trims)
    .innerJoin(modelVersions, eq(trims.modelVersionId, modelVersions.id))
    .innerJoin(carModels, eq(modelVersions.carModelId, carModels.id))
    .innerJoin(brands, eq(carModels.brandId, brands.id))
    .innerJoin(vehicleOffers, eq(vehicleOffers.trimId, trims.id))
    .leftJoin(vehicleMedia, and(eq(vehicleMedia.modelVersionId, modelVersions.id), eq(vehicleMedia.sortOrder, 0)))
    .where(and(eq(carModels.featured, true), eq(brands.active, true), eq(trims.active, true)))
    .orderBy(asc(carModels.id), asc(trims.basePrice))
    .limit(8);

  console.log(`Query returned ${result.length} rows:`);
  for (const row of result) {
    console.log(`  ${row.brandName} ${row.modelName} (${row.trimSlug}): imageUrl=${row.imageUrl}`);
  }
}

main().then(() => client.end()).catch((err) => { console.error(err); process.exit(1); });
