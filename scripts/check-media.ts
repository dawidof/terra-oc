import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import { vehicleMedia, modelVersions, carModels } from "../src/db/schema";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  // All media entries for models with sort_order 0
  const allMedia = await db.execute(sql`
    SELECT cm.slug, vm.url, vm.sort_order, vm.id
    FROM ${vehicleMedia} vm
    JOIN ${modelVersions} mv ON vm.model_version_id = mv.id
    JOIN ${carModels} cm ON mv.car_model_id = cm.id
    WHERE vm.sort_order = 0
    ORDER BY cm.slug, vm.url
  `);
  console.log(`\nAll sort_order=0 entries: ${allMedia.length}`);
  for (const row of allMedia) {
    console.log(`  ${row.slug}: ${row.url}`);
  }

  // Check for old-format URLs (from seed)
  const oldUrls = await db.execute(sql`
    SELECT cm.slug, vm.url, vm.sort_order
    FROM ${vehicleMedia} vm
    JOIN ${modelVersions} mv ON vm.model_version_id = mv.id
    JOIN ${carModels} cm ON mv.car_model_id = cm.id
    WHERE vm.url LIKE '%/zeekr-7x.jpg' OR vm.url LIKE '%/byd-seal.jpg'
       OR vm.url NOT LIKE '%-front.jpg' AND vm.url NOT LIKE '%-side.jpg'
       AND vm.url NOT LIKE '%-rear.jpg' AND vm.url NOT LIKE '%-interior.jpg'
    ORDER BY cm.slug
  `);
  console.log(`\nOld-format URLs: ${oldUrls.length}`);
  for (const row of oldUrls) {
    console.log(`  ${row.slug}: ${row.url} (sort=${row.sort_order})`);
  }

  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
