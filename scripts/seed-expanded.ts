import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";
import {
  brands,
  carModels,
  modelVersions,
  trims,
  vehicleOffers,
  vehicleMedia,
  configurationOptionGroups,
  configurationOptions,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

// ─── Helpers ────────────────────────────────────────────────────────────────

async function ensureBrand(name: string, slug: string, country: string, description: string) {
  let brand = (await db.select().from(brands).where(eq(brands.slug, slug)).limit(1))[0];
  if (!brand) {
    [brand] = await db.insert(brands).values({ name, slug, country, description }).returning();
    console.log(`  + Brand: ${name}`);
  }
  return brand;
}

async function ensureModel(brandId: string, name: string, slug: string, bodyType: string, shortDescription: string, featured = false) {
  let model = (await db.select().from(carModels).where(eq(carModels.slug, slug)).limit(1))[0];
  if (!model) {
    [model] = await db.insert(carModels).values({ brandId, name, slug, bodyType, shortDescription, featured }).returning();
    console.log(`    + Model: ${name}`);
  }
  return model;
}

async function ensureVersion(carModelId: string, name: string, sourceCountry: string, seats = 5, doors = 5) {
  let version = (await db.select().from(modelVersions).where(eq(modelVersions.carModelId, carModelId)).limit(1))[0];
  if (!version) {
    [version] = await db.insert(modelVersions).values({
      carModelId, name, generationCode: name, modelYearFrom: 2024,
      productionStatus: "production", defaultSourceCountry: sourceCountry, seats, doors,
    }).returning();
  }
  return version;
}

async function ensureTrims(
  modelVersionId: string,
  trimData: any[],
  sourceCountry: string,
  logistics: string,
  customs: string,
  deliveryDays: number,
) {
  let existing = await db.select().from(trims).where(eq(trims.modelVersionId, modelVersionId));
  if (existing.length === 0) {
    for (const t of trimData) {
      const [trim] = await db.insert(trims).values({ modelVersionId, ...t }).returning();
      const basePrice = Number(t.basePrice) || 0;
      await db.insert(vehicleOffers).values({
        trimId: trim.id, sourceCountry, condition: "new", modelYear: 2024,
        sourcePrice: t.basePrice, sourceCurrency: "USD", priceBasis: "CIF",
        estimatedLogistics: logistics, estimatedCustoms: customs, estimatedServiceFee: "1500",
        estimatedTotalUsd: String(basePrice + Number(logistics) + Number(customs) + 1500), deliveryDays,
      });
    }
    existing = await db.select().from(trims).where(eq(trims.modelVersionId, modelVersionId));
    console.log(`      ${existing.length} trims created`);
  } else {
    console.log(`      ${existing.length} trims exist`);
  }
  return existing;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🚀 Expanding seed data...\n");
  let totalModels = 0;
  let totalTrims = 0;

  // ═════════════════════════════════════════════════════════════════════════════
  // BYD (expand — add Dolphin, Song Plus, Tang, Qin Plus)
  // ═════════════════════════════════════════════════════════════════════════════
  const byd = await ensureBrand("BYD", "byd", "Китай", "Крупнейший производитель электромобилей в мире");
  const src = "Китай";

  console.log("\n🚗 BYD — Dolphin");
  const dolphin = await ensureModel(byd.id, "Dolphin", "dolphin", "hatchback", "Компактный электрический хэтчбек", true);
  const dolphinVer = await ensureVersion(dolphin.id, "2024", src);
  const dolphinTrims = await ensureTrims(dolphinVer.id, [
    { name: "Active", slug: "byd-dolphin-active", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 70, batteryCapacityKwh: "44.9", rangeKm: 340, acceleration0100: "7.50", basePrice: "16990" },
    { name: "Comfort", slug: "byd-dolphin-comfort", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 70, batteryCapacityKwh: "60.4", rangeKm: 427, acceleration0100: "7.50", basePrice: "19990" },
    { name: "Design", slug: "byd-dolphin-design", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "60.4", rangeKm: 401, acceleration0100: "6.90", basePrice: "22990" },
  ], src, "2000", "2500", 18);
  totalModels++; totalTrims += dolphinTrims.length;

  console.log("\n🚗 BYD — Song Plus DM-i");
  const songPlus = await ensureModel(byd.id, "Song Plus DM-i", "song-plus-dm-i", "SUV", "Гибридный кроссовер с большим запасом хода", true);
  const songPlusVer = await ensureVersion(songPlus.id, "2024", src);
  const songPlusTrims = await ensureTrims(songPlusVer.id, [
    { name: "Standard", slug: "byd-song-plus-standard", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 110, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.90", basePrice: "22990" },
    { name: "Comfort", slug: "byd-song-plus-comfort", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 110, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.90", basePrice: "25990" },
    { name: "Flagship", slug: "byd-song-plus-flagship", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 110, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.90", basePrice: "28990" },
  ], src, "2500", "3500", 20);
  totalModels++; totalTrims += songPlusTrims.length;

  console.log("\n🚗 BYD — Tang");
  const tang = await ensureModel(byd.id, "Tang", "tang", "SUV", "Флагманский электрический кроссовер");
  const tangVer = await ensureVersion(tang.id, "2024", src);
  const tangTrims = await ensureTrims(tangVer.id, [
    { name: "Standard", slug: "byd-tang-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 180, batteryCapacityKwh: "86.4", rangeKm: 505, acceleration0100: "8.50", basePrice: "35990" },
    { name: "AWD", slug: "byd-tang-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 380, batteryCapacityKwh: "108.8", rangeKm: 505, acceleration0100: "4.40", basePrice: "42990" },
  ], src, "3000", "4500", 25);
  totalModels++; totalTrims += tangTrims.length;

  console.log("\n🚗 BYD — Qin Plus");
  const qinPlus = await ensureModel(byd.id, "Qin Plus", "qin-plus", "sedan", "Электрический седан для города");
  const qinPlusVer = await ensureVersion(qinPlus.id, "2024", src);
  const qinPlusTrims = await ensureTrims(qinPlusVer.id, [
    { name: "EV Standard", slug: "byd-qin-plus-ev-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 100, batteryCapacityKwh: "57.0", rangeKm: 420, acceleration0100: "7.30", basePrice: "18990" },
    { name: "EV Long Range", slug: "byd-qin-plus-ev-long-range", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "71.7", rangeKm: 510, acceleration0100: "7.30", basePrice: "21990" },
    { name: "DM-i", slug: "byd-qin-plus-dm-i", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 120, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.30", basePrice: "17990" },
  ], src, "2000", "3000", 20);
  totalModels++; totalTrims += qinPlusTrims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // CHERY (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== CHERY ===");
  const chery = await ensureBrand("Chery", "chery", "Китай", "Один из крупнейших экспортёров Китая");

  console.log("\n🚗 Chery — Tiggo 7 Pro");
  const tiggo7 = await ensureModel(chery.id, "Tiggo 7 Pro", "tiggo-7-pro", "SUV", "Популярный компактный кроссовер", true);
  const tiggo7Ver = await ensureVersion(tiggo7.id, "2024", src);
  const tiggo7Trims = await ensureTrims(tiggo7Ver.id, [
    { name: "Comfort", slug: "chery-tiggo7-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "17990" },
    { name: "Luxury", slug: "chery-tiggo7-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "19990" },
    { name: "Flagship", slug: "chery-tiggo7-flagship", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "21990" },
  ], src, "2000", "3000", 20);
  totalModels++; totalTrims += tiggo7Trims.length;

  console.log("\n🚗 Chery — Tiggo 8 Pro");
  const tiggo8 = await ensureModel(chery.id, "Tiggo 8 Pro", "tiggo-8-pro", "SUV", "Семейный 7-местный кроссовер");
  const tiggo8Ver = await ensureVersion(tiggo8.id, "2024", src);
  const tiggo8Trims = await ensureTrims(tiggo8Ver.id, [
    { name: "Comfort", slug: "chery-tiggo8-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "21990" },
    { name: "Luxury", slug: "chery-tiggo8-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "24990" },
    { name: "Flagship", slug: "chery-tiggo8-flagship", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "27990" },
  ], src, "2500", "3500", 22);
  totalModels++; totalTrims += tiggo8Trims.length;

  console.log("\n🚗 Chery — Omoda 5");
  const omoda5 = await ensureModel(chery.id, "Omoda 5", "omoda-5", "SUV", "Стильный компактный кроссовер", true);
  const omoda5Ver = await ensureVersion(omoda5.id, "2024", src);
  const omoda5Trims = await ensureTrims(omoda5Ver.id, [
    { name: "Style", slug: "chery-omoda5-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "16990" },
    { name: "Premium", slug: "chery-omoda5-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "18990" },
  ], src, "2000", "3000", 18);
  totalModels++; totalTrims += omoda5Trims.length;

  console.log("\n🚗 Chery — Jaecoo 7");
  const jaecoo7 = await ensureModel(chery.id, "Jaecoo 7", "jaecoo-7", "SUV", "Среднеразмерный кроссовер премиум-сегмента");
  const jaecoo7Ver = await ensureVersion(jaecoo7.id, "2024", src);
  const jaecoo7Trims = await ensureTrims(jaecoo7Ver.id, [
    { name: "Comfort", slug: "chery-jaecoo7-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "22990" },
    { name: "Premium", slug: "chery-jaecoo7-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "26990" },
  ], src, "2500", "3500", 22);
  totalModels++; totalTrims += jaecoo7Trims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // GEELY (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== GEELY ===");
  const geely = await ensureBrand("Geely", "geely", "Китай", "Крупный китайский автопроизводитель, владелец Volvo и Zeekr");

  console.log("\n🚗 Geely — Monjaro");
  const monjaro = await ensureModel(geely.id, "Monjaro", "monjaro", "SUV", "Флагманский полноразмерный кроссовер", true);
  const monjaroVer = await ensureVersion(monjaro.id, "2024", src);
  const monjaroTrims = await ensureTrims(monjaroVer.id, [
    { name: "Comfort", slug: "geely-monjaro-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 238, acceleration0100: "7.70", basePrice: "26990" },
    { name: "Premium", slug: "geely-monjaro-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 238, acceleration0100: "7.70", basePrice: "30990" },
    { name: "Flagship", slug: "geely-monjaro-flagship", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 238, acceleration0100: "7.70", basePrice: "34990" },
  ], src, "3000", "4000", 25);
  totalModels++; totalTrims += monjaroTrims.length;

  console.log("\n🚗 Geely — Coolray");
  const coolray = await ensureModel(geely.id, "Coolray", "coolray", "SUV", "Компактный кроссовер");
  const coolrayVer = await ensureVersion(coolray.id, "2024", src);
  const coolrayTrims = await ensureTrims(coolrayVer.id, [
    { name: "Comfort", slug: "geely-coolray-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 174, basePrice: "17990" },
    { name: "Premium", slug: "geely-coolray-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 1500, enginePowerHp: 174, basePrice: "20990" },
  ], src, "2000", "3000", 20);
  totalModels++; totalTrims += coolrayTrims.length;

  console.log("\n🚗 Geely — Emgrand");
  const emgrand = await ensureModel(geely.id, "Emgrand", "emgrand", "sedan", "Бюджетный седан");
  const emgrandVer = await ensureVersion(emgrand.id, "2024", src);
  const emgrandTrims = await ensureTrims(emgrandVer.id, [
    { name: "Standard", slug: "geely-emgrand-standard", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 114, basePrice: "13990" },
    { name: "Comfort", slug: "geely-emgrand-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 114, basePrice: "15990" },
  ], src, "1500", "2500", 18);
  totalModels++; totalTrims += emgrandTrims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // HAVAL (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== HAVAL ===");
  const haval = await ensureBrand("Haval", "haval", "Китай", "Бренд SUV от Great Wall Motors");

  console.log("\n🚗 Haval — Jolion");
  const jolion = await ensureModel(haval.id, "Jolion", "jolion", "SUV", "Компактный городской кроссовер", true);
  const jolionVer = await ensureVersion(jolion.id, "2024", src);
  const jolionTrims = await ensureTrims(jolionVer.id, [
    { name: "Standard", slug: "haval-jolion-standard", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 150, basePrice: "16990" },
    { name: "Comfort", slug: "haval-jolion-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 150, basePrice: "18990" },
    { name: "Premium", slug: "haval-jolion-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 150, basePrice: "20990" },
  ], src, "2000", "3000", 20);
  totalModels++; totalTrims += jolionTrims.length;

  console.log("\n🚗 Haval — H6");
  const h6 = await ensureModel(haval.id, "H6", "h6", "SUV", "Среднеразмерный кроссовер");
  const h6Ver = await ensureVersion(h6.id, "2024", src);
  const h6Trims = await ensureTrims(h6Ver.id, [
    { name: "Comfort", slug: "haval-h6-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "21990" },
    { name: "Premium", slug: "haval-h6-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 211, basePrice: "25990" },
  ], src, "2500", "3500", 22);
  totalModels++; totalTrims += h6Trims.length;

  console.log("\n🚗 Haval — F7");
  const f7 = await ensureModel(haval.id, "F7", "f7", "SUV", "Спортивный кроссовер");
  const f7Ver = await ensureVersion(f7.id, "2024", src);
  const f7Trims = await ensureTrims(f7Ver.id, [
    { name: "Comfort", slug: "haval-f7-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "20990" },
    { name: "Premium", slug: "haval-f7-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 211, basePrice: "24990" },
  ], src, "2500", "3500", 22);
  totalModels++; totalTrims += f7Trims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // MG (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== MG ===");
  const mg = await ensureBrand("MG", "mg", "Китай", "Британский бренд, сейчас принадлежит SAIC Motor");

  console.log("\n🚗 MG — MG4");
  const mg4 = await ensureModel(mg.id, "MG4", "mg4", "hatchback", "Электрический хэтчбек");
  const mg4Ver = await ensureVersion(mg4.id, "2024", src);
  const mg4Trims = await ensureTrims(mg4Ver.id, [
    { name: "Standard", slug: "mg-mg4-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 125, batteryCapacityKwh: "51.0", rangeKm: 350, acceleration0100: "7.70", basePrice: "19990" },
    { name: "Long Range", slug: "mg-mg4-long-range", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 150, batteryCapacityKwh: "64.0", rangeKm: 450, acceleration0100: "7.70", basePrice: "23990" },
    { name: "XPOWER", slug: "mg-mg4-xpower", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 330, batteryCapacityKwh: "64.0", rangeKm: 400, acceleration0100: "3.80", basePrice: "28990" },
  ], src, "2500", "3500", 22);
  totalModels++; totalTrims += mg4Trims.length;

  console.log("\n🚗 MG — HS");
  const mgHs = await ensureModel(mg.id, "HS", "mg-hs", "SUV", "Компактный кроссовер");
  const mgHsVer = await ensureVersion(mgHs.id, "2024", src);
  const mgHsTrims = await ensureTrims(mgHsVer.id, [
    { name: "Comfort", slug: "mg-hs-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "19990" },
    { name: "Luxury", slug: "mg-hs-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "22990" },
    { name: "PHEV", slug: "mg-hs-phev", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 120, batteryCapacityKwh: "16.5", rangeKm: 75, enginePowerHp: 169, engineDisplacementCc: 1500, basePrice: "25990" },
  ], src, "2500", "3500", 22);
  totalModels++; totalTrims += mgHsTrims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // HYUNDAI (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== HYUNDAI ===");
  const hyundai = await ensureBrand("Hyundai", "hyundai", "Корея", "Корейский автопроизводитель, популярный в Узбекистане");
  const srcKorea = "Корея";

  console.log("\n🚗 Hyundai — Tucson");
  const tucson = await ensureModel(hyundai.id, "Tucson", "tucson", "SUV", "Самый популярный корейский импорт в Узбекистане", true);
  const tucsonVer = await ensureVersion(tucson.id, "2024", srcKorea);
  const tucsonTrims = await ensureTrims(tucsonVer.id, [
    { name: "Comfort", slug: "hyundai-tucson-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "26990" },
    { name: "Style", slug: "hyundai-tucson-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "29990" },
    { name: "Premium", slug: "hyundai-tucson-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "33990" },
    { name: "Hybrid", slug: "hyundai-tucson-hybrid", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 60, batteryCapacityKwh: "1.49", rangeKm: 55, enginePowerHp: 180, engineDisplacementCc: 1600, basePrice: "35990" },
  ], srcKorea, "3000", "4000", 30);
  totalModels++; totalTrims += tucsonTrims.length;

  console.log("\n🚗 Hyundai — Ioniq 5");
  const ioniq5 = await ensureModel(hyundai.id, "Ioniq 5", "ioniq-5", "SUV", "Электрический кроссовер на платформе E-GMP", true);
  const ioniq5Ver = await ensureVersion(ioniq5.id, "2024", srcKorea);
  const ioniq5Trims = await ensureTrims(ioniq5Ver.id, [
    { name: "Standard Range", slug: "hyundai-ioniq5-std", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 125, batteryCapacityKwh: "58.0", rangeKm: 384, acceleration0100: "8.50", basePrice: "36990" },
    { name: "Long Range", slug: "hyundai-ioniq5-lr", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 168, batteryCapacityKwh: "80.0", rangeKm: 507, acceleration0100: "7.40", basePrice: "42990" },
    { name: "AWD", slug: "hyundai-ioniq5-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 239, batteryCapacityKwh: "80.0", rangeKm: 481, acceleration0100: "5.20", basePrice: "48990" },
  ], srcKorea, "3500", "5000", 35);
  totalModels++; totalTrims += ioniq5Trims.length;

  console.log("\n🚗 Hyundai — Sonata");
  const sonata = await ensureModel(hyundai.id, "Sonata", "sonata", "sedan", "Среднеразмерный седан");
  const sonataVer = await ensureVersion(sonata.id, "2024", srcKorea);
  const sonataTrims = await ensureTrims(sonataVer.id, [
    { name: "Comfort", slug: "hyundai-sonata-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "24990" },
    { name: "Style", slug: "hyundai-sonata-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 180, basePrice: "28990" },
    { name: "Premium", slug: "hyundai-sonata-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 180, basePrice: "32990" },
  ], srcKorea, "3000", "4000", 30);
  totalModels++; totalTrims += sonataTrims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // KIA (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== KIA ===");
  const kia = await ensureBrand("Kia", "kia", "Корея", "Корейский автопроизводитель");

  console.log("\n🚗 Kia — Sportage");
  const sportage = await ensureModel(kia.id, "Sportage", "sportage", "SUV", "Популярный компактный кроссовер", true);
  const sportageVer = await ensureVersion(sportage.id, "2024", srcKorea);
  const sportageTrims = await ensureTrims(sportageVer.id, [
    { name: "Comfort", slug: "kia-sportage-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "26990" },
    { name: "Prestige", slug: "kia-sportage-prestige", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "29990" },
    { name: "GT-Line", slug: "kia-sportage-gt-line", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "33990" },
  ], srcKorea, "3000", "4000", 30);
  totalModels++; totalTrims += sportageTrims.length;

  console.log("\n🚗 Kia — EV6");
  const ev6 = await ensureModel(kia.id, "EV6", "ev6", "SUV", "Электрический кроссовер на платформе E-GMP", true);
  const ev6Ver = await ensureVersion(ev6.id, "2024", srcKorea);
  const ev6Trims = await ensureTrims(ev6Ver.id, [
    { name: "Standard", slug: "kia-ev6-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 168, batteryCapacityKwh: "58.0", rangeKm: 394, acceleration0100: "7.30", basePrice: "38990" },
    { name: "Long Range", slug: "kia-ev6-lr", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 239, batteryCapacityKwh: "77.4", rangeKm: 528, acceleration0100: "5.20", basePrice: "45990" },
    { name: "GT-Line AWD", slug: "kia-ev6-gt-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 430, batteryCapacityKwh: "77.4", rangeKm: 506, acceleration0100: "3.50", basePrice: "52990" },
  ], srcKorea, "3500", "5000", 35);
  totalModels++; totalTrims += ev6Trims.length;

  console.log("\n🚗 Kia — K5");
  const k5 = await ensureModel(kia.id, "K5", "k5", "sedan", "Спортивный среднеразмерный седан");
  const k5Ver = await ensureVersion(k5.id, "2024", srcKorea);
  const k5Trims = await ensureTrims(k5Ver.id, [
    { name: "Comfort", slug: "kia-k5-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "25990" },
    { name: "Premium", slug: "kia-k5-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 190, basePrice: "30990" },
    { name: "GT-Line", slug: "kia-k5-gt-line", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 190, basePrice: "34990" },
  ], srcKorea, "3000", "4000", 30);
  totalModels++; totalTrims += k5Trims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // TESLA (new brand)
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== TESLA ===");
  const tesla = await ensureBrand("Tesla", "tesla", "США", "Американский производитель электромобилей");
  const srcUSA = "США";

  console.log("\n🚗 Tesla — Model 3");
  const model3 = await ensureModel(tesla.id, "Model 3", "model-3", "sedan", "Электрический седан");
  const model3Ver = await ensureVersion(model3.id, "2024", srcUSA);
  const model3Trims = await ensureTrims(model3Ver.id, [
    { name: "Standard Range", slug: "tesla-model3-std", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 208, batteryCapacityKwh: "60.0", rangeKm: 438, acceleration0100: "6.10", basePrice: "38990" },
    { name: "Long Range", slug: "tesla-model3-lr", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 366, batteryCapacityKwh: "75.0", rangeKm: 528, acceleration0100: "4.40", basePrice: "46990" },
  ], srcUSA, "4000", "5500", 40);
  totalModels++; totalTrims += model3Trims.length;

  console.log("\n🚗 Tesla — Model Y");
  const modelY = await ensureModel(tesla.id, "Model Y", "model-y", "SUV", "Электрический кроссовер", true);
  const modelYVer = await ensureVersion(modelY.id, "2024", srcUSA);
  const modelYTrims = await ensureTrims(modelYVer.id, [
    { name: "Standard Range", slug: "tesla-modely-std", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 220, batteryCapacityKwh: "60.0", rangeKm: 455, acceleration0100: "5.90", basePrice: "42990" },
    { name: "Long Range", slug: "tesla-modely-lr", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 348, batteryCapacityKwh: "75.0", rangeKm: 533, acceleration0100: "5.00", basePrice: "50990" },
    { name: "Performance", slug: "tesla-modely-perf", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 377, batteryCapacityKwh: "75.0", rangeKm: 514, acceleration0100: "3.70", basePrice: "56990" },
  ], srcUSA, "4000", "5500", 40);
  totalModels++; totalTrims += modelYTrims.length;

  // ═════════════════════════════════════════════════════════════════════════════
  // Configuration options for popular models
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n\n=== CONFIGURATION OPTIONS ===");

  // Helper to add config options for a trim
  async function addConfigOptions(trimId: string, options: { type: string; name: string; items: { name: string; code: string; priceDelta: string | null }[] }[]) {
    for (const group of options) {
      const existing = await db.select().from(configurationOptionGroups)
        .where(and(
          eq(configurationOptionGroups.trimId, trimId),
          eq(configurationOptionGroups.type, group.type),
        ));
      if (existing.length > 0) continue;

      const [grp] = await db.insert(configurationOptionGroups).values({
        trimId, type: group.type, name: group.name, required: group.type === "exterior_color" || group.type === "interior_color",
      }).returning();

      await db.insert(configurationOptions).values(
        group.items.map((item) => ({
          groupId: grp.id, name: item.name, code: item.code,
          priceDelta: item.priceDelta, priceCurrency: item.priceDelta ? "USD" : null,
          priceKnown: item.priceDelta !== null, available: true,
        })),
      );
    }
  }

  // BYD Song Plus config
  const songPlusFlagship = songPlusTrims[2];
  if (songPlusFlagship) {
    await addConfigOptions(songPlusFlagship.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [
        { name: "Белый", code: "white", priceDelta: "0" },
        { name: "Серый", code: "grey", priceDelta: "0" },
        { name: "Синий", code: "blue", priceDelta: "300" },
        { name: "Красный", code: "red", priceDelta: "300" },
      ]},
      { type: "interior_color", name: "Цвет салона", items: [
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Бежевый", code: "beige", priceDelta: "0" },
      ]},
    ]);
    console.log("  ✓ Config options for BYD Song Plus Flagship");
  }

  // Hyundai Tucson Premium config
  const tucsonPremium = tucsonTrims[2];
  if (tucsonPremium) {
    await addConfigOptions(tucsonPremium.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [
        { name: "Белый перламутр", code: "pearl-white", priceDelta: "0" },
        { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" },
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Синий", code: "ocean-blue", priceDelta: "400" },
        { name: "Красный", code: "fiery-red", priceDelta: "400" },
      ]},
      { type: "interior_color", name: "Цвет салона", items: [
        { name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" },
        { name: "Серая кожа", code: "grey-leather", priceDelta: "800" },
        { name: "Бежевая кожа", code: "beige-leather", priceDelta: "800" },
      ]},
      { type: "package", name: "Пакеты", items: [
        { name: "Пакет «Премиум»", code: "premium-pkg", priceDelta: "2500" },
      ]},
    ]);
    console.log("  ✓ Config options for Hyundai Tucson Premium");
  }

  // Kia Sportage GT-Line config
  const sportageGT = sportageTrims[2];
  if (sportageGT) {
    await addConfigOptions(sportageGT.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [
        { name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" },
        { name: "Снежный белый", code: "snow-white", priceDelta: "0" },
        { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" },
        { name: "Огненный красный", code: "fire-red", priceDelta: "500" },
      ]},
      { type: "interior_color", name: "Цвет салона", items: [
        { name: "Чёрная кожа", code: "black-leather", priceDelta: "0" },
        { name: "Серая кожа", code: "grey-leather", priceDelta: "0" },
      ]},
    ]);
    console.log("  ✓ Config options for Kia Sportage GT-Line");
  }

  // Haval Jolion Standard config
  const jolionStandard = jolionTrims[0];
  if (jolionStandard) {
    await addConfigOptions(jolionStandard.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [
        { name: "Белый", code: "white", priceDelta: "0" },
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Серый", code: "grey", priceDelta: "0" },
      ]},
      { type: "interior_color", name: "Цвет салона", items: [
        { name: "Чёрный", code: "black", priceDelta: "0" },
      ]},
    ]);
    console.log("  ✓ Config options for Haval Jolion Standard");
  }

  // Haval Jolion Comfort config
  const jolionComfort = jolionTrims[1];
  if (jolionComfort) {
    await addConfigOptions(jolionComfort.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [
        { name: "Белый", code: "white", priceDelta: "0" },
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Серый", code: "grey", priceDelta: "0" },
        { name: "Синий", code: "blue", priceDelta: "300" },
      ]},
      { type: "interior_color", name: "Цвет салона", items: [
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Бежевый", code: "beige", priceDelta: "0" },
      ]},
    ]);
    console.log("  ✓ Config options for Haval Jolion Comfort");
  }

  // Haval Jolion Premium config
  const jolionPremium = jolionTrims[2];
  if (jolionPremium) {
    await addConfigOptions(jolionPremium.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [
        { name: "Белый", code: "white", priceDelta: "0" },
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Серый", code: "grey", priceDelta: "0" },
        { name: "Синий", code: "blue", priceDelta: "300" },
        { name: "Красный", code: "red", priceDelta: "300" },
      ]},
      { type: "interior_color", name: "Цвет салона", items: [
        { name: "Чёрный", code: "black", priceDelta: "0" },
        { name: "Бежевый", code: "beige", priceDelta: "0" },
      ]},
      { type: "package", name: "Пакеты", items: [
        { name: "Пакет «Премиум»", code: "premium-pkg", priceDelta: "1500" },
      ]},
    ]);
    console.log("  ✓ Config options for Haval Jolion Premium");
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═════════════════════════════════════════════════════════════════════════════
  console.log("\n" + "=".repeat(50));
  console.log("📊 Expanded seed summary");
  console.log("=".repeat(50));
  console.log(`New models added: ${totalModels}`);
  console.log(`New trims added: ${totalTrims}`);
  console.log(`\nBrands: BYD (expanded), Chery, Geely, Haval, MG, Hyundai, Kia, Tesla`);
  console.log("\n✅ Expansion complete!");

  await client.end();
}

main().catch((err) => {
  console.error("Seed expansion failed:", err);
  process.exit(1);
});
