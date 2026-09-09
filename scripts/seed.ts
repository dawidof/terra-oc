import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and } from "drizzle-orm";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import {
  users,
  siteSettings,
  specificationGroups,
  specificationDefinitions,
  brands,
  carModels,
  modelVersions,
  trims,
  vehicleOffers,
  vehicleMedia,
  calculationRuleVersions,
  exchangeRates,
  configurationOptionGroups,
  configurationOptions,
  reviews,
  contentPages,
  customers,
  leads,
  leadConfigurations,
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function upsert(table: any, data: any, conflictTarget: any) {
  const [row] = await db.insert(table).values(data).onConflictDoNothing({ target: conflictTarget }).returning();
  if (row) return row;
  return (await db.select().from(table).where(eq(conflictTarget, data[Object.keys(conflictTarget)[0]])).limit(1))[0];
}

async function seed() {
  console.log("Seeding database...");

  // ─── Admin user ──────────────────────────────────────────────────────────
  let admin = (await db.select().from(users).where(eq(users.email, "admin@terraauto.uz")).limit(1))[0];
  if (!admin) {
    const adminHash = await bcrypt.hash("admin123", 10);
    [admin] = await db.insert(users).values({ email: "admin@terraauto.uz", passwordHash: adminHash, name: "Админ", role: "admin" }).returning();
  }
  console.log(`✓ Admin: ${admin.email}`);

  // ─── Manager user ────────────────────────────────────────────────────────
  let manager = (await db.select().from(users).where(eq(users.email, "manager@terraauto.uz")).limit(1))[0];
  if (!manager) {
    const managerHash = await bcrypt.hash("manager123", 10);
    [manager] = await db.insert(users).values({ email: "manager@terraauto.uz", passwordHash: managerHash, name: "Менеджер", role: "manager" }).returning();
  }
  console.log(`✓ Manager: ${manager.email}`);

  // ─── Site settings ───────────────────────────────────────────────────────
  const settings = [
    { key: "phone", valueJson: "+998 90 123 45 67" },
    { key: "telegram", valueJson: "https://t.me/terraauto_" },
    { key: "instagram", valueJson: "https://instagram.com/terraauto_" },
    { key: "youtube", valueJson: "https://youtube.com/@TerraAutoUz" },
    { key: "office_address", valueJson: "г. Ташкент, Сергелийский район, рынок Автосохото" },
    { key: "disclaimer", valueJson: "Все цены являются ориентировочными. Итоговая стоимость может измениться в зависимости от курса валют и условий поставки." },
  ];
  for (const setting of settings) {
    await db.insert(siteSettings).values(setting).onConflictDoNothing();
  }
  console.log(`✓ Site settings: ${settings.length} entries`);

  // ─── Specification groups ────────────────────────────────────────────────
  let specGroups = await db.select().from(specificationGroups);
  if (specGroups.length === 0) {
    specGroups = await db.insert(specificationGroups).values([
      { name: "Основные характеристики", slug: "basic" },
      { name: "Габариты", slug: "dimensions" },
      { name: "Двигатель", slug: "engine" },
      { name: "Батарея", slug: "battery" },
      { name: "Зарядка", slug: "charging" },
      { name: "Подвеска", slug: "suspension" },
      { name: "Безопасность", slug: "safety" },
      { name: "Комфорт", slug: "comfort" },
      { name: "Мультимедиа", slug: "multimedia" },
      { name: "Экстерьер", slug: "exterior" },
    ]).returning();
  }
  console.log(`✓ Specification groups: ${specGroups.length}`);

  // ─── Specification definitions ───────────────────────────────────────────
  let specDefs = await db.select().from(specificationDefinitions);
  if (specDefs.length === 0) {
    specDefs = await db.insert(specificationDefinitions).values([
      { groupId: specGroups[0].id, name: "Тип кузова", slug: "body_type", dataType: "string" },
      { groupId: specGroups[0].id, name: "Привод", slug: "drivetrain", dataType: "string" },
      { groupId: specGroups[0].id, name: "Количество мест", slug: "seats", dataType: "integer" },
      { groupId: specGroups[0].id, name: "Количество дверей", slug: "doors", dataType: "integer" },
      { groupId: specGroups[1].id, name: "Длина", slug: "length_mm", dataType: "integer", unit: "мм" },
      { groupId: specGroups[1].id, name: "Ширина", slug: "width_mm", dataType: "integer", unit: "мм" },
      { groupId: specGroups[1].id, name: "Высота", slug: "height_mm", dataType: "integer", unit: "мм" },
      { groupId: specGroups[1].id, name: "Колёсная база", slug: "wheelbase_mm", dataType: "integer", unit: "мм" },
      { groupId: specGroups[2].id, name: "Объём двигателя", slug: "engine_displacement_cc", dataType: "integer", unit: "см³" },
      { groupId: specGroups[2].id, name: "Мощность двигателя", slug: "engine_power_hp", dataType: "integer", unit: "л.с." },
      { groupId: specGroups[3].id, name: "Ёмкость батареи", slug: "battery_capacity_kwh", dataType: "decimal", unit: "кВт·ч" },
      { groupId: specGroups[3].id, name: "Запас хода", slug: "range_km", dataType: "integer", unit: "км" },
      { groupId: specGroups[4].id, name: "Максимальная зарядка", slug: "max_charge_kw", dataType: "integer", unit: "кВт" },
      { groupId: specGroups[5].id, name: "Тип подвески", slug: "suspension_type", dataType: "string" },
    ]).returning();
  }
  console.log(`✓ Specification definitions: ${specDefs.length}`);

  // ─── Helper: get or create brand ─────────────────────────────────────────
  async function ensureBrand(name: string, slug: string, country: string, description: string) {
    let brand = (await db.select().from(brands).where(eq(brands.slug, slug)).limit(1))[0];
    if (!brand) {
      [brand] = await db.insert(brands).values({ name, slug, country, description }).returning();
    }
    return brand;
  }

  // ─── Helper: get or create model ─────────────────────────────────────────
  async function ensureModel(brandId: string, name: string, slug: string, bodyType: string, shortDescription: string, featured = false) {
    let model = (await db.select().from(carModels).where(eq(carModels.slug, slug)).limit(1))[0];
    if (!model) {
      [model] = await db.insert(carModels).values({ brandId, name, slug, bodyType, shortDescription, featured }).returning();
    }
    return model;
  }

  // ─── Helper: get or create version ───────────────────────────────────────
  async function ensureVersion(carModelId: string, name: string) {
    let version = (await db.select().from(modelVersions).where(eq(modelVersions.carModelId, carModelId)).limit(1))[0];
    if (!version) {
      [version] = await db.insert(modelVersions).values({
        carModelId, name, generationCode: name, modelYearFrom: 2024,
        productionStatus: "production", defaultSourceCountry: "Китай", seats: 5, doors: 5,
      }).returning();
    }
    return version;
  }

  // ─── Helper: ensure trims + offers ───────────────────────────────────────
  async function ensureTrims(modelVersionId: string, trimData: any[], logistics: string, customs: string, deliveryDays: number) {
    let existing = await db.select().from(trims).where(eq(trims.modelVersionId, modelVersionId));
    if (existing.length === 0) {
      for (const t of trimData) {
        const [trim] = await db.insert(trims).values({ modelVersionId, ...t }).returning();
        await db.insert(vehicleOffers).values({
          trimId: trim.id, sourceCountry: "Китай", condition: "new", modelYear: 2024,
          sourcePrice: t.basePrice, sourceCurrency: "USD", priceBasis: "CIF",
          estimatedLogistics: logistics, estimatedCustoms: customs, estimatedServiceFee: "1500",
          estimatedTotalUsd: String(Number(t.basePrice) + Number(logistics) + Number(customs) + 1500), deliveryDays,
        });
      }
      existing = await db.select().from(trims).where(eq(trims.modelVersionId, modelVersionId));
    }
    return existing;
  }

  // ─── Helper: add configuration options for a trim ────────────────────────
  async function addConfigOptions(
    trimId: string,
    options: { type: string; name: string; required?: boolean; items: { name: string; code: string; priceDelta: string | null }[] }[],
  ) {
    // Check which groups already exist for this trim in one query
    const existingGroups = await db.select().from(configurationOptionGroups)
      .where(eq(configurationOptionGroups.trimId, trimId));
    const existingTypes = new Set(existingGroups.map((g) => g.type));

    const groupsToInsert: typeof options = [];
    for (const group of options) {
      if (!existingTypes.has(group.type)) {
        groupsToInsert.push(group);
      }
    }

    if (groupsToInsert.length === 0) return;

    // Batch insert all groups at once
    const insertedGroups = await db.insert(configurationOptionGroups)
      .values(groupsToInsert.map((g) => ({
        trimId,
        type: g.type,
        name: g.name,
        required: g.required ?? (g.type === "exterior_color" || g.type === "interior_color"),
      })))
      .returning();

    // Batch insert all options for all groups at once
    const allOptions: { groupId: string; name: string; code: string; priceDelta: string | null; priceCurrency: string | null; priceKnown: boolean; available: boolean }[] = [];
    for (let i = 0; i < groupsToInsert.length; i++) {
      const grp = insertedGroups[i];
      for (const item of groupsToInsert[i].items) {
        allOptions.push({
          groupId: grp.id,
          name: item.name,
          code: item.code,
          priceDelta: item.priceDelta,
          priceCurrency: item.priceDelta ? "USD" : null,
          priceKnown: item.priceDelta !== null,
          available: true,
        });
      }
    }

    if (allOptions.length > 0) {
      await db.insert(configurationOptions).values(allOptions);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ZEEKR
  // ═══════════════════════════════════════════════════════════════════════════
  const zeekr = await ensureBrand("Zeekr", "zeekr", "Китай", "Электромобили премиум-класса от Geely");

  const zeekr7x = await ensureModel(zeekr.id, "7X", "7x", "SUV", "Электрический кроссовер премиум-класса", true);
  const zeekr7xVer = await ensureVersion(zeekr7x.id, "2024");
  const zeekr7xTrims = await ensureTrims(zeekr7xVer.id, [
    { name: "SE", slug: "zeekr-7x-se", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 310, batteryCapacityKwh: "75.6", rangeKm: 510, acceleration0100: "5.80", basePrice: "33990" },
    { name: "Long Range", slug: "zeekr-7x-long-range", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 310, batteryCapacityKwh: "100.0", rangeKm: 615, acceleration0100: "5.80", basePrice: "37990" },
    { name: "AWD", slug: "zeekr-7x-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 440, batteryCapacityKwh: "100.0", rangeKm: 580, acceleration0100: "3.80", basePrice: "42990" },
    { name: "Performance", slug: "zeekr-7x-performance", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 580, batteryCapacityKwh: "100.0", rangeKm: 540, acceleration0100: "3.50", basePrice: "47990" },
  ], "3000", "4500", 25);

  const zeekr001 = await ensureModel(zeekr.id, "001", "001", "sedan", "Электрический лифтбек премиум-класса", true);
  const zeekr001Ver = await ensureVersion(zeekr001.id, "2024");
  const zeekr001Trims = await ensureTrims(zeekr001Ver.id, [
    { name: "Standard", slug: "zeekr-001-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 300, batteryCapacityKwh: "100.0", rangeKm: 620, acceleration0100: "6.50", basePrice: "39990" },
    { name: "Long Range", slug: "zeekr-001-long-range", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 300, batteryCapacityKwh: "140.0", rangeKm: 750, acceleration0100: "6.50", basePrice: "45990" },
    { name: "Performance", slug: "zeekr-001-performance", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 544, batteryCapacityKwh: "100.0", rangeKm: 580, acceleration0100: "3.50", basePrice: "52990" },
  ], "3000", "4500", 25);

  console.log(`✓ Zeekr: 7X (${zeekr7xTrims.length} trims) + 001 (${zeekr001Trims.length} trims)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // BYD
  // ═══════════════════════════════════════════════════════════════════════════
  const byd = await ensureBrand("BYD", "byd", "Китай", "Крупнейший производитель электромобилей в мире");

  const atto3 = await ensureModel(byd.id, "Atto 3", "atto-3", "SUV", "Компактный электрический кроссовер", true);
  const atto3Ver = await ensureVersion(atto3.id, "2024");
  const atto3Trims = await ensureTrims(atto3Ver.id, [
    { name: "Standard", slug: "byd-atto3-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "49.9", rangeKm: 345, acceleration0100: "7.30", basePrice: "24990" },
    { name: "Comfort", slug: "byd-atto3-comfort", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "60.5", rangeKm: 420, acceleration0100: "7.30", basePrice: "27990" },
  ], "2500", "3500", 20);

  const seal = await ensureModel(byd.id, "Seal", "seal", "sedan", "Спортивный электрический седан", true);
  const sealVer = await ensureVersion(seal.id, "2024");
  const sealTrims = await ensureTrims(sealVer.id, [
    { name: "Standard", slug: "byd-seal-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 170, batteryCapacityKwh: "61.4", rangeKm: 510, acceleration0100: "7.50", basePrice: "29990" },
    { name: "Design", slug: "byd-seal-design", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 230, batteryCapacityKwh: "82.5", rangeKm: 570, acceleration0100: "5.90", basePrice: "34990" },
    { name: "AWD", slug: "byd-seal-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 390, batteryCapacityKwh: "82.5", rangeKm: 520, acceleration0100: "3.80", basePrice: "40990" },
  ], "3000", "4000", 22);

  const han = await ensureModel(byd.id, "Han", "han", "sedan", "Флагманский электрический седан");
  const hanVer = await ensureVersion(han.id, "2024");
  const hanTrims = await ensureTrims(hanVer.id, [
    { name: "EV Standard", slug: "byd-han-ev-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 180, batteryCapacityKwh: "64.8", rangeKm: 506, acceleration0100: "7.90", basePrice: "33990" },
    { name: "EV Long Range", slug: "byd-han-ev-long-range", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 180, batteryCapacityKwh: "85.4", rangeKm: 610, acceleration0100: "7.90", basePrice: "38990" },
    { name: "EV AWD", slug: "byd-han-ev-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 380, batteryCapacityKwh: "85.4", rangeKm: 560, acceleration0100: "3.90", basePrice: "44990" },
  ], "3000", "4500", 25);

  const dolphin = await ensureModel(byd.id, "Dolphin", "dolphin", "hatchback", "Компактный электрический хэтчбек", true);
  const dolphinVer = await ensureVersion(dolphin.id, "2024");
  const dolphinTrims = await ensureTrims(dolphinVer.id, [
    { name: "Active", slug: "byd-dolphin-active", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 70, batteryCapacityKwh: "44.9", rangeKm: 340, acceleration0100: "7.50", basePrice: "16990" },
    { name: "Comfort", slug: "byd-dolphin-comfort", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 70, batteryCapacityKwh: "60.4", rangeKm: 427, acceleration0100: "7.50", basePrice: "19990" },
    { name: "Design", slug: "byd-dolphin-design", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "60.4", rangeKm: 401, acceleration0100: "6.90", basePrice: "22990" },
  ], "2000", "2500", 18);

  const songPlus = await ensureModel(byd.id, "Song Plus DM-i", "song-plus-dm-i", "SUV", "Гибридный кроссовер с большим запасом хода", true);
  const songPlusVer = await ensureVersion(songPlus.id, "2024");
  const songPlusTrims = await ensureTrims(songPlusVer.id, [
    { name: "Standard", slug: "byd-song-plus-standard", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 110, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.90", basePrice: "22990" },
    { name: "Comfort", slug: "byd-song-plus-comfort", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 110, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.90", basePrice: "25990" },
    { name: "Flagship", slug: "byd-song-plus-flagship", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 110, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.90", basePrice: "28990" },
  ], "2500", "3500", 20);

  const tang = await ensureModel(byd.id, "Tang", "tang", "SUV", "Флагманский электрический кроссовер");
  const tangVer = await ensureVersion(tang.id, "2024");
  const tangTrims = await ensureTrims(tangVer.id, [
    { name: "Standard", slug: "byd-tang-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 180, batteryCapacityKwh: "86.4", rangeKm: 505, acceleration0100: "8.50", basePrice: "35990" },
    { name: "AWD", slug: "byd-tang-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 380, batteryCapacityKwh: "108.8", rangeKm: 505, acceleration0100: "4.40", basePrice: "42990" },
  ], "3000", "4500", 25);

  const qinPlus = await ensureModel(byd.id, "Qin Plus", "qin-plus", "sedan", "Электрический седан для города");
  const qinPlusVer = await ensureVersion(qinPlus.id, "2024");
  const qinPlusTrims = await ensureTrims(qinPlusVer.id, [
    { name: "EV Standard", slug: "byd-qin-plus-ev-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 100, batteryCapacityKwh: "57.0", rangeKm: 420, acceleration0100: "7.30", basePrice: "18990" },
    { name: "EV Long Range", slug: "byd-qin-plus-ev-long-range", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "71.7", rangeKm: 510, acceleration0100: "7.30", basePrice: "21990" },
    { name: "DM-i", slug: "byd-qin-plus-dm-i", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 145, batteryCapacityKwh: "18.3", rangeKm: 120, enginePowerHp: 110, engineDisplacementCc: 1500, acceleration0100: "7.30", basePrice: "17990" },
  ], "2000", "3000", 20);

  const yuanUp = await ensureModel(byd.id, "Yuan Up", "yuan-up", "SUV", "Компактный электрический кроссовер", true);
  const yuanUpVer = await ensureVersion(yuanUp.id, "2024");
  const yuanUpTrims = await ensureTrims(yuanUpVer.id, [
    { name: "Standard", slug: "byd-yuan-up-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 70, batteryCapacityKwh: "45.1", rangeKm: 380, acceleration0100: "7.90", basePrice: "18990" },
    { name: "Comfort", slug: "byd-yuan-up-comfort", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "60.4", rangeKm: 480, acceleration0100: "7.30", basePrice: "21990" },
  ], "2500", "3000", 20);

  const chazor = await ensureModel(byd.id, "Chazor (Destroyer 05)", "chazor", "sedan", "Электрический седан нового поколения", true);
  const chazorVer = await ensureVersion(chazor.id, "2024");
  const chazorTrims = await ensureTrims(chazorVer.id, [
    { name: "Standard", slug: "byd-chazor-standard", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 150, batteryCapacityKwh: "57.0", rangeKm: 460, acceleration0100: "7.50", basePrice: "22990" },
    { name: "Premium", slug: "byd-chazor-premium", powertrainType: "bev", drivetrain: "FWD", motorPowerKw: 200, batteryCapacityKwh: "71.7", rangeKm: 550, acceleration0100: "6.50", basePrice: "26990" },
  ], "2500", "3500", 22);

  console.log(`✓ BYD: Atto 3 (${atto3Trims.length}) + Seal (${sealTrims.length}) + Han (${hanTrims.length}) + Dolphin (${dolphinTrims.length}) + Song Plus (${songPlusTrims.length}) + Tang (${tangTrims.length}) + Qin Plus (${qinPlusTrims.length}) + Yuan Up (${yuanUpTrims.length}) + Chazor (${chazorTrims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANGAN
  // ═══════════════════════════════════════════════════════════════════════════
  const changan = await ensureBrand("Changan", "changan", "Китай", "Один из крупнейших автопроизводителей Китая");

  const cs55 = await ensureModel(changan.id, "CS55 Plus", "cs55-plus", "SUV", "Популярный кроссовер с бензиновым двигателем");
  const cs55Ver = await ensureVersion(cs55.id, "2024");
  const cs55Trims = await ensureTrims(cs55Ver.id, [
    { name: "Comfort", slug: "cs55-plus-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 181, basePrice: "17990" },
    { name: "Luxury", slug: "cs55-plus-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 181, basePrice: "19990" },
    { name: "Flagship", slug: "cs55-plus-flagship", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 181, basePrice: "21990" },
  ], "2000", "3000", 20);

  const deepalS7 = await ensureModel(changan.id, "Deepal S7", "deepal-s7", "SUV", "Электрический кроссовер от подбренда Deepal", true);
  const deepalS7Ver = await ensureVersion(deepalS7.id, "2024");
  const deepalS7Trims = await ensureTrims(deepalS7Ver.id, [
    { name: "Standard", slug: "deepal-s7-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 160, batteryCapacityKwh: "66.6", rangeKm: 440, acceleration0100: "7.50", basePrice: "25990" },
    { name: "Long Range", slug: "deepal-s7-long-range", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 190, batteryCapacityKwh: "79.9", rangeKm: 520, acceleration0100: "6.70", basePrice: "29990" },
  ], "2500", "3500", 22);

  console.log(`✓ Changan: CS55 Plus (${cs55Trims.length}) + Deepal S7 (${deepalS7Trims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // CHERY
  // ═══════════════════════════════════════════════════════════════════════════
  const chery = await ensureBrand("Chery", "chery", "Китай", "Один из крупнейших экспортёров Китая");

  const tiggo7 = await ensureModel(chery.id, "Tiggo 7 Pro", "tiggo-7-pro", "SUV", "Популярный компактный кроссовер", true);
  const tiggo7Ver = await ensureVersion(tiggo7.id, "2024");
  const tiggo7Trims = await ensureTrims(tiggo7Ver.id, [
    { name: "Comfort", slug: "chery-tiggo7-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "17990" },
    { name: "Luxury", slug: "chery-tiggo7-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "19990" },
    { name: "Flagship", slug: "chery-tiggo7-flagship", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "21990" },
  ], "2000", "3000", 20);

  const tiggo8 = await ensureModel(chery.id, "Tiggo 8 Pro", "tiggo-8-pro", "SUV", "Семейный 7-местный кроссовер");
  const tiggo8Ver = await ensureVersion(tiggo8.id, "2024");
  const tiggo8Trims = await ensureTrims(tiggo8Ver.id, [
    { name: "Comfort", slug: "chery-tiggo8-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "21990" },
    { name: "Luxury", slug: "chery-tiggo8-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "24990" },
    { name: "Flagship", slug: "chery-tiggo8-flagship", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "27990" },
  ], "2500", "3500", 22);

  const omoda5 = await ensureModel(chery.id, "Omoda 5", "omoda-5", "SUV", "Стильный компактный кроссовер", true);
  const omoda5Ver = await ensureVersion(omoda5.id, "2024");
  const omoda5Trims = await ensureTrims(omoda5Ver.id, [
    { name: "Style", slug: "chery-omoda5-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "16990" },
    { name: "Premium", slug: "chery-omoda5-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 147, basePrice: "18990" },
  ], "2000", "3000", 18);

  const jaecoo7 = await ensureModel(chery.id, "Jaecoo 7", "jaecoo-7", "SUV", "Среднеразмерный кроссовер премиум-сегмента");
  const jaecoo7Ver = await ensureVersion(jaecoo7.id, "2024");
  const jaecoo7Trims = await ensureTrims(jaecoo7Ver.id, [
    { name: "Comfort", slug: "chery-jaecoo7-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "22990" },
    { name: "Premium", slug: "chery-jaecoo7-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 1600, enginePowerHp: 197, basePrice: "26990" },
  ], "2500", "3500", 22);

  console.log(`✓ Chery: Tiggo 7 Pro (${tiggo7Trims.length}) + Tiggo 8 Pro (${tiggo8Trims.length}) + Omoda 5 (${omoda5Trims.length}) + Jaecoo 7 (${jaecoo7Trims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // GEELY
  // ═══════════════════════════════════════════════════════════════════════════
  const geely = await ensureBrand("Geely", "geely", "Китай", "Крупный китайский автопроизводитель, владелец Volvo и Zeekr");

  const monjaro = await ensureModel(geely.id, "Monjaro", "monjaro", "SUV", "Флагманский полноразмерный кроссовер", true);
  const monjaroVer = await ensureVersion(monjaro.id, "2024");
  const monjaroTrims = await ensureTrims(monjaroVer.id, [
    { name: "Comfort", slug: "geely-monjaro-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 238, acceleration0100: "7.70", basePrice: "26990" },
    { name: "Premium", slug: "geely-monjaro-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 238, acceleration0100: "7.70", basePrice: "30990" },
    { name: "Flagship", slug: "geely-monjaro-flagship", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 238, acceleration0100: "7.70", basePrice: "34990" },
  ], "3000", "4000", 25);

  const coolray = await ensureModel(geely.id, "Coolray", "coolray", "SUV", "Компактный кроссовер");
  const coolrayVer = await ensureVersion(coolray.id, "2024");
  const coolrayTrims = await ensureTrims(coolrayVer.id, [
    { name: "Comfort", slug: "geely-coolray-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 174, basePrice: "17990" },
    { name: "Premium", slug: "geely-coolray-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 1500, enginePowerHp: 174, basePrice: "20990" },
  ], "2000", "3000", 20);

  const emgrand = await ensureModel(geely.id, "Emgrand", "emgrand", "sedan", "Бюджетный седан");
  const emgrandVer = await ensureVersion(emgrand.id, "2024");
  const emgrandTrims = await ensureTrims(emgrandVer.id, [
    { name: "Standard", slug: "geely-emgrand-standard", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 114, basePrice: "13990" },
    { name: "Comfort", slug: "geely-emgrand-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 114, basePrice: "15990" },
  ], "1500", "2500", 18);

  console.log(`✓ Geely: Monjaro (${monjaroTrims.length}) + Coolray (${coolrayTrims.length}) + Emgrand (${emgrandTrims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // HAVAL
  // ═══════════════════════════════════════════════════════════════════════════
  const haval = await ensureBrand("Haval", "haval", "Китай", "Бренд SUV от Great Wall Motors");

  const jolion = await ensureModel(haval.id, "Jolion", "jolion", "SUV", "Компактный городской кроссовер", true);
  const jolionVer = await ensureVersion(jolion.id, "2024");
  const jolionTrims = await ensureTrims(jolionVer.id, [
    { name: "Standard", slug: "haval-jolion-standard", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 150, basePrice: "16990" },
    { name: "Comfort", slug: "haval-jolion-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 150, basePrice: "18990" },
    { name: "Premium", slug: "haval-jolion-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 150, basePrice: "20990" },
  ], "2000", "3000", 20);

  const h6 = await ensureModel(haval.id, "H6", "h6", "SUV", "Среднеразмерный кроссовер");
  const h6Ver = await ensureVersion(h6.id, "2024");
  const h6Trims = await ensureTrims(h6Ver.id, [
    { name: "Comfort", slug: "haval-h6-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "21990" },
    { name: "Premium", slug: "haval-h6-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 211, basePrice: "25990" },
  ], "2500", "3500", 22);

  const f7 = await ensureModel(haval.id, "F7", "f7", "SUV", "Спортивный кроссовер");
  const f7Ver = await ensureVersion(f7.id, "2024");
  const f7Trims = await ensureTrims(f7Ver.id, [
    { name: "Comfort", slug: "haval-f7-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "20990" },
    { name: "Premium", slug: "haval-f7-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 211, basePrice: "24990" },
  ], "2500", "3500", 22);

  console.log(`✓ Haval: Jolion (${jolionTrims.length}) + H6 (${h6Trims.length}) + F7 (${f7Trims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // MG
  // ═══════════════════════════════════════════════════════════════════════════
  const mg = await ensureBrand("MG", "mg", "Китай", "Британский бренд, сейчас принадлежит SAIC Motor");

  const mg4 = await ensureModel(mg.id, "MG4", "mg4", "hatchback", "Электрический хэтчбек");
  const mg4Ver = await ensureVersion(mg4.id, "2024");
  const mg4Trims = await ensureTrims(mg4Ver.id, [
    { name: "Standard", slug: "mg-mg4-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 125, batteryCapacityKwh: "51.0", rangeKm: 350, acceleration0100: "7.70", basePrice: "19990" },
    { name: "Long Range", slug: "mg-mg4-long-range", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 150, batteryCapacityKwh: "64.0", rangeKm: 450, acceleration0100: "7.70", basePrice: "23990" },
    { name: "XPOWER", slug: "mg-mg4-xpower", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 330, batteryCapacityKwh: "64.0", rangeKm: 400, acceleration0100: "3.80", basePrice: "28990" },
  ], "2500", "3500", 22);

  const mgHs = await ensureModel(mg.id, "HS", "mg-hs", "SUV", "Компактный кроссовер");
  const mgHsVer = await ensureVersion(mgHs.id, "2024");
  const mgHsTrims = await ensureTrims(mgHsVer.id, [
    { name: "Comfort", slug: "mg-hs-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "19990" },
    { name: "Luxury", slug: "mg-hs-luxury", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 169, basePrice: "22990" },
    { name: "PHEV", slug: "mg-hs-phev", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 120, batteryCapacityKwh: "16.5", rangeKm: 75, enginePowerHp: 169, engineDisplacementCc: 1500, basePrice: "25990" },
  ], "2500", "3500", 22);

  console.log(`✓ MG: MG4 (${mg4Trims.length}) + HS (${mgHsTrims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // HYUNDAI
  // ═══════════════════════════════════════════════════════════════════════════
  const hyundai = await ensureBrand("Hyundai", "hyundai", "Корея", "Корейский автопроизводитель, популярный в Узбекистане");

  const tucson = await ensureModel(hyundai.id, "Tucson", "tucson", "SUV", "Самый популярный корейский импорт в Узбекистане", true);
  const tucsonVer = await ensureVersion(tucson.id, "2024");
  const tucsonTrims = await ensureTrims(tucsonVer.id, [
    { name: "Comfort", slug: "hyundai-tucson-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "26990" },
    { name: "Style", slug: "hyundai-tucson-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "29990" },
    { name: "Premium", slug: "hyundai-tucson-premium", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "33990" },
    { name: "Hybrid", slug: "hyundai-tucson-hybrid", powertrainType: "phev", drivetrain: "FWD", motorPowerKw: 60, batteryCapacityKwh: "1.49", rangeKm: 55, enginePowerHp: 180, engineDisplacementCc: 1600, basePrice: "35990" },
  ], "3000", "4000", 30);

  const ioniq5 = await ensureModel(hyundai.id, "Ioniq 5", "ioniq-5", "SUV", "Электрический кроссовер на платформе E-GMP", true);
  const ioniq5Ver = await ensureVersion(ioniq5.id, "2024");
  const ioniq5Trims = await ensureTrims(ioniq5Ver.id, [
    { name: "Standard Range", slug: "hyundai-ioniq5-std", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 125, batteryCapacityKwh: "58.0", rangeKm: 384, acceleration0100: "8.50", basePrice: "36990" },
    { name: "Long Range", slug: "hyundai-ioniq5-lr", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 168, batteryCapacityKwh: "80.0", rangeKm: 507, acceleration0100: "7.40", basePrice: "42990" },
    { name: "AWD", slug: "hyundai-ioniq5-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 239, batteryCapacityKwh: "80.0", rangeKm: 481, acceleration0100: "5.20", basePrice: "48990" },
  ], "3500", "5000", 35);

  const sonata = await ensureModel(hyundai.id, "Sonata", "sonata", "sedan", "Среднеразмерный седан");
  const sonataVer = await ensureVersion(sonata.id, "2024");
  const sonataTrims = await ensureTrims(sonataVer.id, [
    { name: "Comfort", slug: "hyundai-sonata-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "24990" },
    { name: "Style", slug: "hyundai-sonata-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 180, basePrice: "28990" },
    { name: "Premium", slug: "hyundai-sonata-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 180, basePrice: "32990" },
  ], "3000", "4000", 30);

  const creta = await ensureModel(hyundai.id, "Creta", "creta", "SUV", "Компактный городской кроссовер", true);
  const cretaVer = await ensureVersion(creta.id, "2024");
  const cretaTrims = await ensureTrims(cretaVer.id, [
    { name: "Comfort", slug: "hyundai-creta-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 115, basePrice: "19990" },
    { name: "Style", slug: "hyundai-creta-style", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 115, basePrice: "21990" },
    { name: "Premium", slug: "hyundai-creta-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 115, basePrice: "24990" },
  ], "2500", "3000", 25);

  console.log(`✓ Hyundai: Tucson (${tucsonTrims.length}) + Ioniq 5 (${ioniq5Trims.length}) + Sonata (${sonataTrims.length}) + Creta (${cretaTrims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // KIA
  // ═══════════════════════════════════════════════════════════════════════════
  const kia = await ensureBrand("Kia", "kia", "Корея", "Корейский автопроизводитель");

  const sportage = await ensureModel(kia.id, "Sportage", "sportage", "SUV", "Популярный компактный кроссовер", true);
  const sportageVer = await ensureVersion(sportage.id, "2024");
  const sportageTrims = await ensureTrims(sportageVer.id, [
    { name: "Comfort", slug: "kia-sportage-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "26990" },
    { name: "Prestige", slug: "kia-sportage-prestige", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "29990" },
    { name: "GT-Line", slug: "kia-sportage-gt-line", powertrainType: "petrol", drivetrain: "AWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "33990" },
  ], "3000", "4000", 30);

  const ev6 = await ensureModel(kia.id, "EV6", "ev6", "SUV", "Электрический кроссовер на платформе E-GMP", true);
  const ev6Ver = await ensureVersion(ev6.id, "2024");
  const ev6Trims = await ensureTrims(ev6Ver.id, [
    { name: "Standard", slug: "kia-ev6-standard", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 168, batteryCapacityKwh: "58.0", rangeKm: 394, acceleration0100: "7.30", basePrice: "38990" },
    { name: "Long Range", slug: "kia-ev6-lr", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 239, batteryCapacityKwh: "77.4", rangeKm: 528, acceleration0100: "5.20", basePrice: "45990" },
    { name: "GT-Line AWD", slug: "kia-ev6-gt-awd", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 430, batteryCapacityKwh: "77.4", rangeKm: 506, acceleration0100: "3.50", basePrice: "52990" },
  ], "3500", "5000", 35);

  const k5 = await ensureModel(kia.id, "K5", "k5", "sedan", "Спортивный среднеразмерный седан");
  const k5Ver = await ensureVersion(k5.id, "2024");
  const k5Trims = await ensureTrims(k5Ver.id, [
    { name: "Comfort", slug: "kia-k5-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2000, enginePowerHp: 150, basePrice: "25990" },
    { name: "Premium", slug: "kia-k5-premium", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 190, basePrice: "30990" },
    { name: "GT-Line", slug: "kia-k5-gt-line", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 2500, enginePowerHp: 190, basePrice: "34990" },
  ], "3000", "4000", 30);

  const sonet = await ensureModel(kia.id, "Sonet", "sonet", "SUV", "Компактный городской кроссовер — бестселлер в Узбекистане", true);
  const sonetVer = await ensureVersion(sonet.id, "2024");
  const sonetTrims = await ensureTrims(sonetVer.id, [
    { name: "Comfort", slug: "kia-sonet-comfort", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 115, basePrice: "16990" },
    { name: "Prestige", slug: "kia-sonet-prestige", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 115, basePrice: "18990" },
    { name: "GT-Line", slug: "kia-sonet-gt-line", powertrainType: "petrol", drivetrain: "FWD", engineDisplacementCc: 1500, enginePowerHp: 115, basePrice: "20990" },
  ], "2000", "2500", 22);

  console.log(`✓ Kia: Sportage (${sportageTrims.length}) + EV6 (${ev6Trims.length}) + K5 (${k5Trims.length}) + Sonet (${sonetTrims.length})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // TESLA
  // ═══════════════════════════════════════════════════════════════════════════
  const tesla = await ensureBrand("Tesla", "tesla", "США", "Американский производитель электромобилей");

  const model3 = await ensureModel(tesla.id, "Model 3", "model-3", "sedan", "Электрический седан");
  const model3Ver = await ensureVersion(model3.id, "2024");
  const model3Trims = await ensureTrims(model3Ver.id, [
    { name: "Standard Range", slug: "tesla-model3-std", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 208, batteryCapacityKwh: "60.0", rangeKm: 438, acceleration0100: "6.10", basePrice: "38990" },
    { name: "Long Range", slug: "tesla-model3-lr", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 366, batteryCapacityKwh: "75.0", rangeKm: 528, acceleration0100: "4.40", basePrice: "46990" },
  ], "4000", "5500", 40);

  const modelY = await ensureModel(tesla.id, "Model Y", "model-y", "SUV", "Электрический кроссовер", true);
  const modelYVer = await ensureVersion(modelY.id, "2024");
  const modelYTrims = await ensureTrims(modelYVer.id, [
    { name: "Standard Range", slug: "tesla-modely-std", powertrainType: "bev", drivetrain: "RWD", motorPowerKw: 220, batteryCapacityKwh: "60.0", rangeKm: 455, acceleration0100: "5.90", basePrice: "42990" },
    { name: "Long Range", slug: "tesla-modely-lr", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 348, batteryCapacityKwh: "75.0", rangeKm: 533, acceleration0100: "5.00", basePrice: "50990" },
    { name: "Performance", slug: "tesla-modely-perf", powertrainType: "bev", drivetrain: "AWD", motorPowerKw: 377, batteryCapacityKwh: "75.0", rangeKm: 514, acceleration0100: "3.70", basePrice: "56990" },
  ], "4000", "5500", 40);

  console.log(`✓ Tesla: Model 3 (${model3Trims.length}) + Model Y (${modelYTrims.length})`);

  // ─── Vehicle Media ──────────────────────────────────────────────────────
  const mediaUrls: Record<string, { url: string; alt: string }> = {
    [zeekr7xVer.id]: { url: "/images/cars/zeekr-7x.jpg", alt: "Zeekr 7X — электрический кроссовер" },
    [zeekr001Ver.id]: { url: "/images/cars/zeekr-001.jpg", alt: "Zeekr 001 — электрический лифтбек" },
    [atto3Ver.id]: { url: "/images/cars/byd-atto3.jpg", alt: "BYD Atto 3 — компактный электрический кроссовер" },
    [sealVer.id]: { url: "/images/cars/byd-seal.jpg", alt: "BYD Seal — спортивный электрический седан" },
    [hanVer.id]: { url: "/images/cars/byd-han.jpg", alt: "BYD Han — флагманский электрический седан" },
    [dolphinVer.id]: { url: "/images/cars/byd-dolphin.jpg", alt: "BYD Dolphin — компактный электрический хэтчбек" },
    [songPlusVer.id]: { url: "/images/cars/byd-song-plus.jpg", alt: "BYD Song Plus — гибридный кроссовер" },
    [tangVer.id]: { url: "/images/cars/byd-tang.jpg", alt: "BYD Tang — флагманский электрический кроссовер" },
    [qinPlusVer.id]: { url: "/images/cars/byd-qin-plus.jpg", alt: "BYD Qin Plus — электрический седан" },
    [yuanUpVer.id]: { url: "/images/cars/byd-yuan-up.jpg", alt: "BYD Yuan Up — компактный электрический кроссовер" },
    [chazorVer.id]: { url: "/images/cars/byd-chazor.jpg", alt: "BYD Chazor — электрический седан" },
    [cs55Ver.id]: { url: "/images/cars/changan-cs55.jpg", alt: "Changan CS55 Plus — популярный кроссовер" },
    [deepalS7Ver.id]: { url: "/images/cars/deepal-s7.jpg", alt: "Deepal S7 — электрический кроссовер" },
    [tiggo7Ver.id]: { url: "/images/cars/chery-tiggo7.jpg", alt: "Chery Tiggo 7 Pro — компактный кроссовер" },
    [tiggo8Ver.id]: { url: "/images/cars/chery-tiggo8.jpg", alt: "Chery Tiggo 8 Pro — семейный кроссовер" },
    [omoda5Ver.id]: { url: "/images/cars/chery-omoda5.jpg", alt: "Chery Omoda 5 — стильный кроссовер" },
    [jaecoo7Ver.id]: { url: "/images/cars/chery-jaecoo7.jpg", alt: "Chery Jaecoo 7 — премиум кроссовер" },
    [monjaroVer.id]: { url: "/images/cars/geely-monjaro.jpg", alt: "Geely Monjaro — полноразмерный кроссовер" },
    [coolrayVer.id]: { url: "/images/cars/geely-coolray.jpg", alt: "Geely Coolray — компактный кроссовер" },
    [emgrandVer.id]: { url: "/images/cars/geely-emgrand.jpg", alt: "Geely Emgrand — бюджетный седан" },
    [jolionVer.id]: { url: "/images/cars/haval-jolion.jpg", alt: "Haval Jolion — городской кроссовер" },
    [h6Ver.id]: { url: "/images/cars/haval-h6.jpg", alt: "Haval H6 — среднеразмерный кроссовер" },
    [f7Ver.id]: { url: "/images/cars/haval-f7.jpg", alt: "Haval F7 — спортивный кроссовер" },
    [mg4Ver.id]: { url: "/images/cars/mg-mg4.jpg", alt: "MG MG4 — электрический хэтчбек" },
    [mgHsVer.id]: { url: "/images/cars/mg-hs.jpg", alt: "MG HS — компактный кроссовер" },
    [tucsonVer.id]: { url: "/images/cars/hyundai-tucson.jpg", alt: "Hyundai Tucson — популярный кроссовер" },
    [ioniq5Ver.id]: { url: "/images/cars/hyundai-ioniq5.jpg", alt: "Hyundai Ioniq 5 — электрический кроссовер" },
    [sonataVer.id]: { url: "/images/cars/hyundai-sonata.jpg", alt: "Hyundai Sonata — среднеразмерный седан" },
    [cretaVer.id]: { url: "/images/cars/hyundai-creta.jpg", alt: "Hyundai Creta — городской кроссовер" },
    [sportageVer.id]: { url: "/images/cars/kia-sportage.jpg", alt: "Kia Sportage — компактный кроссовер" },
    [ev6Ver.id]: { url: "/images/cars/kia-ev6.jpg", alt: "Kia EV6 — электрический кроссовер" },
    [k5Ver.id]: { url: "/images/cars/kia-k5.jpg", alt: "Kia K5 — спортивный седан" },
    [sonetVer.id]: { url: "/images/cars/kia-sonet.jpg", alt: "Kia Sonet — городской кроссовер" },
    [model3Ver.id]: { url: "/images/cars/tesla-model3.jpg", alt: "Tesla Model 3 — электрический седан" },
    [modelYVer.id]: { url: "/images/cars/tesla-modely.jpg", alt: "Tesla Model Y — электрический кроссовер" },
  };
  let mediaCount = (await db.select().from(vehicleMedia)).length;
  if (mediaCount === 0) {
    for (const [versionId, media] of Object.entries(mediaUrls)) {
      await db.insert(vehicleMedia).values({
        modelVersionId: versionId, type: "exterior", url: media.url, alt: media.alt,
      });
    }
    mediaCount = Object.keys(mediaUrls).length;
  }
  console.log(`✓ Vehicle media: ${mediaCount} entries`);

  // ─── Calculation Rules ──────────────────────────────────────────────────
  const calcRules = [
    { country: "Китай", condition: "new", powertrain: "bev", parametersJson: { logistics: 2500, customsDutyPercent: 15, excisePercent: 5, exciseThresholdKw: 50, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "Китай", condition: "new", powertrain: "petrol", parametersJson: { logistics: 2000, customsDutyPercent: 20, excisePercent: 15, exciseThresholdCc: 2000, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "Китай", condition: "new", powertrain: "diesel", parametersJson: { logistics: 2000, customsDutyPercent: 20, excisePercent: 15, exciseThresholdCc: 2500, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "Китай", condition: "new", powertrain: "phev", parametersJson: { logistics: 2500, customsDutyPercent: 15, excisePercent: 5, exciseThresholdKw: 50, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "Китай", condition: "used", powertrain: "bev", parametersJson: { logistics: 2500, customsDutyPercent: 15, excisePercent: 5, exciseThresholdKw: 50, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "Китай", condition: "used", powertrain: "petrol", parametersJson: { logistics: 2000, customsDutyPercent: 20, excisePercent: 15, exciseThresholdCc: 2000, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "Корея", condition: "new", powertrain: "bev", parametersJson: { logistics: 3000, customsDutyPercent: 15, excisePercent: 5, exciseThresholdKw: 50, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
    { country: "ОАЭ", condition: "new", powertrain: "bev", parametersJson: { logistics: 3500, customsDutyPercent: 15, excisePercent: 5, exciseThresholdKw: 50, vatPercent: 12, certificationFees: 500, serviceFee: 1200 }, formulaVersion: "uz-2024-v1" },
  ];

  for (const rule of calcRules) {
    await db.insert(calculationRuleVersions).values({
      ...rule,
      validFrom: new Date("2024-01-01"),
      active: true,
    });
  }
  console.log(`✓ Calculation rules: ${calcRules.length}`);

  // ─── Exchange Rates ─────────────────────────────────────────────────────
  await db.insert(exchangeRates).values([
    { fromCurrency: "USD", toCurrency: "UZS", rate: "12700", source: "demo" },
    { fromCurrency: "CNY", toCurrency: "USD", rate: "0.14", source: "demo" },
    { fromCurrency: "KRW", toCurrency: "USD", rate: "0.00075", source: "demo" },
    { fromCurrency: "AED", toCurrency: "USD", rate: "0.27", source: "demo" },
  ]);
  console.log("✓ Exchange rates: 4 entries");

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATOR OPTIONS — ALL TRIMS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n=== CONFIGURATOR OPTIONS ===");

  const colorWhite = { name: "Белый", code: "white", priceDelta: "0" };
  const colorGrey = { name: "Серый", code: "grey", priceDelta: "0" };
  const colorBlack = { name: "Чёрный", code: "black", priceDelta: "0" };
  const colorBlue = { name: "Синий", code: "blue", priceDelta: "300" };
  const colorRed = { name: "Красный", code: "red", priceDelta: "300" };
  const colorGreen = { name: "Зелёный", code: "green", priceDelta: "500" };

  const intBlack = { name: "Чёрный", code: "black", priceDelta: "0" };
  const intBeige = { name: "Бежевый", code: "beige", priceDelta: "0" };
  const intRed = { name: "Красный", code: "red", priceDelta: "500" };

  const wheel17 = { name: '17" стандартные', code: "17-standard", priceDelta: "0" };
  const wheel18 = { name: '18" стандартные', code: "18-standard", priceDelta: "0" };
  const wheel18Sport = { name: '18" спортивные', code: "18-sport", priceDelta: "500" };
  const wheel19 = { name: '19" спортивные', code: "19-sport", priceDelta: "800" };
  const wheel19Standard = { name: '19" стандартные', code: "19-standard", priceDelta: "0" };
  const wheel20 = { name: '20" спортивные', code: "20-sport", priceDelta: "1200" };
  const wheel20Standard = { name: '20" стандартные', code: "20-standard", priceDelta: "0" };

  const pkgComfort = { name: "Пакет «Комфорт»", code: "comfort-package", priceDelta: "1500" };
  const pkgPremium = { name: "Пакет «Премиум»", code: "premium-package", priceDelta: "3000" };
  const pkgLuxury = { name: "Пакет «Люкс»", code: "luxury-package", priceDelta: "4500" };

  const optPanoramicRoof = { name: "Панорамная крыша", code: "panoramic-roof", priceDelta: "1200" };
  const optHud = { name: "Проекционный дисплей", code: "hud", priceDelta: "600" };
  const optFridge = { name: "Холодильник в бардачке", code: "fridge", priceDelta: "400" };
  const optSoundSystem = { name: "Аудиосистема премиум", code: "premium-sound", priceDelta: "800" };

  const wheelsBev = [wheel19Standard, wheel20, wheel20Standard];
  const wheelsPetrol = [wheel17, wheel18Sport, wheel19];

  // ─── ZEEKR 7X configs ──────────────────────────────────────────────────
  const zeekr7xBaseColors = [colorWhite, colorGrey, colorBlack, colorBlue];
  const zeekr7xPerfColors = [...zeekr7xBaseColors, colorGreen];
  const zeekr7xBaseInterior = [intBlack, intBeige];
  const zeekr7xTopInterior = [...zeekr7xBaseInterior, intRed];

  for (const trim of zeekr7xTrims) {
    const isTop = trim.name === "Performance" || trim.name === "AWD";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? zeekr7xPerfColors : zeekr7xBaseColors },
      { type: "interior_color", name: "Цвет салона", items: isTop ? zeekr7xTopInterior : zeekr7xBaseInterior },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgComfort, pkgPremium, pkgLuxury] : [pkgComfort, pkgPremium] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optFridge] : [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ Zeekr 7X: all trims configured");

  // ─── ZEEKR 001 configs ─────────────────────────────────────────────────
  for (const trim of zeekr001Trims) {
    const isTop = trim.name === "Performance";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorGreen] : [colorWhite, colorGrey, colorBlack, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? zeekr7xTopInterior : zeekr7xBaseInterior },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgComfort, pkgPremium, pkgLuxury] : [pkgComfort, pkgPremium] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Zeekr 001: all trims configured");

  // ─── BYD Atto 3 configs ────────────────────────────────────────────────
  for (const trim of atto3Trims) {
    const isTop = trim.name === "Comfort";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, ...(isTop ? [intBeige] : [])] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ BYD Atto 3: all trims configured");

  // ─── BYD Seal configs ──────────────────────────────────────────────────
  for (const trim of sealTrims) {
    const isTop = trim.name === "AWD";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlack, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgComfort, pkgPremium] : [pkgComfort] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ BYD Seal: all trims configured");

  // ─── BYD Han configs ───────────────────────────────────────────────────
  for (const trim of hanTrims) {
    const isTop = trim.name === "EV AWD";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlack, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: [pkgPremium, pkgLuxury] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ BYD Han: all trims configured");

  // ─── BYD Dolphin configs ───────────────────────────────────────────────
  for (const trim of dolphinTrims) {
    const isTop = trim.name === "Design";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed, colorGreen] : [colorWhite, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ BYD Dolphin: all trims configured");

  // ─── BYD Song Plus configs ─────────────────────────────────────────────
  for (const trim of songPlusTrims) {
    const isTop = trim.name === "Flagship";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed, colorGreen] : [colorWhite, colorGrey, colorBlue, colorRed] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgComfort, pkgPremium] : [pkgComfort] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ BYD Song Plus: all trims configured");

  // ─── BYD Tang configs ──────────────────────────────────────────────────
  for (const trim of tangTrims) {
    const isTop = trim.name === "AWD";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlack, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: [pkgPremium, pkgLuxury] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ BYD Tang: all trims configured");

  // ─── BYD Qin Plus configs ──────────────────────────────────────────────
  for (const trim of qinPlusTrims) {
    const isTop = trim.name === "EV Long Range";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ BYD Qin Plus: all trims configured");

  // ─── BYD Yuan Up configs ───────────────────────────────────────────────
  for (const trim of yuanUpTrims) {
    const isTop = trim.name === "Comfort";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ BYD Yuan Up: all trims configured");

  // ─── BYD Chazor configs ────────────────────────────────────────────────
  for (const trim of chazorTrims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ BYD Chazor: all trims configured");

  // ─── Changan CS55 Plus configs ─────────────────────────────────────────
  for (const trim of cs55Trims) {
    const isTop = trim.name === "Flagship";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorRed] : [colorWhite, colorGrey, colorBlack] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsPetrol },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Changan CS55 Plus: all trims configured");

  // ─── Deepal S7 configs ─────────────────────────────────────────────────
  for (const trim of deepalS7Trims) {
    const isTop = trim.name === "Long Range";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Deepal S7: all trims configured");

  // ─── Chery Tiggo 7 Pro configs ────────────────────────────────────────
  for (const trim of tiggo7Trims) {
    const isTop = trim.name === "Flagship";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorRed, colorBlue] : [colorWhite, colorGrey, colorBlack, colorRed] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsPetrol },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Chery Tiggo 7 Pro: all trims configured");

  // ─── Chery Tiggo 8 Pro configs ────────────────────────────────────────
  for (const trim of tiggo8Trims) {
    const isTop = trim.name === "Flagship";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorRed, colorBlue] : [colorWhite, colorGrey, colorBlack, colorRed] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsPetrol },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optSoundSystem] : [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ Chery Tiggo 8 Pro: all trims configured");

  // ─── Chery Omoda 5 configs ────────────────────────────────────────────
  for (const trim of omoda5Trims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorRed, colorBlue] : [colorWhite, colorGrey, colorBlack] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18, wheel18Sport] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Chery Omoda 5: all trims configured");

  // ─── Chery Jaecoo 7 configs ───────────────────────────────────────────
  for (const trim of jaecoo7Trims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorRed, colorBlue] : [colorWhite, colorGrey, colorBlack, colorRed] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsPetrol },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Chery Jaecoo 7: all trims configured");

  // ─── Geely Monjaro configs ────────────────────────────────────────────
  for (const trim of monjaroTrims) {
    const isTop = trim.name === "Flagship";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlack, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: wheelsPetrol },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium, pkgLuxury] : [pkgPremium] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Geely Monjaro: all trims configured");

  // ─── Geely Coolray configs ────────────────────────────────────────────
  for (const trim of coolrayTrims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue, colorRed] : [colorWhite, colorGrey, colorBlack] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18, wheel18Sport] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Geely Coolray: all trims configured");

  // ─── Geely Emgrand configs ────────────────────────────────────────────
  for (const trim of emgrandTrims) {
    const isTop = trim.name === "Comfort";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlack, colorBlue] : [colorWhite, colorGrey, colorBlack] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof] : [] },
    ]);
  }
  console.log("  ✓ Geely Emgrand: all trims configured");

  // ─── Haval Jolion configs ─────────────────────────────────────────────
  for (const trim of jolionTrims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorBlack, colorGrey, colorBlue, colorRed] : [colorWhite, colorBlack, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18, wheel18Sport] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Haval Jolion: all trims configured");

  // ─── Haval H6 configs ─────────────────────────────────────────────────
  for (const trim of h6Trims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorBlack, colorGrey, colorBlue, colorRed] : [colorWhite, colorBlack, colorGrey, colorBlue] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19, wheel19Standard] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Haval H6: all trims configured");

  // ─── Haval F7 configs ─────────────────────────────────────────────────
  for (const trim of f7Trims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorBlack, colorGrey, colorBlue, colorRed] : [colorWhite, colorBlack, colorGrey] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intBeige, intRed] : [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19, wheel19Standard] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Haval F7: all trims configured");

  // ─── MG MG4 configs ───────────────────────────────────────────────────
  for (const trim of mg4Trims) {
    const isTop = trim.name === "XPOWER";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed, colorGreen] : [colorWhite, colorGrey, colorBlue, colorRed] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [intBlack, intRed] : [intBlack] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ MG MG4: all trims configured");

  // ─── MG HS configs ────────────────────────────────────────────────────
  for (const trim of mgHsTrims) {
    const isTop = trim.name === "PHEV";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop ? [colorWhite, colorGrey, colorBlue, colorRed, colorBlack] : [colorWhite, colorGrey, colorBlue, colorRed] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, intBeige] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ MG HS: all trims configured");

  // ─── Hyundai Tucson configs ───────────────────────────────────────────
  for (const trim of tucsonTrims) {
    const isTop = trim.name === "Premium" || trim.name === "Hybrid";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "400" }, { name: "Огненный красный", code: "fiery-red", priceDelta: "400" }]
        : [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "400" }] },
      { type: "interior_color", name: "Цвет салона", items: isTop
        ? [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "800" }, { name: "Бежевая кожа", code: "beige-leather", priceDelta: "800" }]
        : [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "800" }] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19, wheel19Standard] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optSoundSystem] : [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ Hyundai Tucson: all trims configured");

  // ─── Hyundai Ioniq 5 configs ──────────────────────────────────────────
  for (const trim of ioniq5Trims) {
    const isTop = trim.name === "AWD";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "500" }, { name: "Зелёный матовый", code: "matte-green", priceDelta: "800" }]
        : [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "500" }] },
      { type: "interior_color", name: "Цвет салона", items: isTop
        ? [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "800" }, { name: "Бежевая кожа", code: "beige-leather", priceDelta: "800" }]
        : [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "800" }] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Hyundai Ioniq 5: all trims configured");

  // ─── Hyundai Sonata configs ───────────────────────────────────────────
  for (const trim of sonataTrims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "400" }, { name: "Огненный красный", code: "fiery-red", priceDelta: "400" }]
        : [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "400" }] },
      { type: "interior_color", name: "Цвет салона", items: isTop
        ? [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "800" }, { name: "Бежевая кожа", code: "beige-leather", priceDelta: "800" }]
        : [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "800" }] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18, wheel18Sport] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optSoundSystem] : [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ Hyundai Sonata: all trims configured");

  // ─── Hyundai Creta configs ────────────────────────────────────────────
  for (const trim of cretaTrims) {
    const isTop = trim.name === "Premium";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack, { name: "Океанский синий", code: "ocean-blue", priceDelta: "400" }]
        : [{ name: "Белый перламутр", code: "pearl-white", priceDelta: "0" }, { name: "Серый металлик", code: "grey-metallic", priceDelta: "0" }, colorBlack] },
      { type: "interior_color", name: "Цвет салона", items: [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Бежевая ткань", code: "beige-cloth", priceDelta: "0" }] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Hyundai Creta: all trims configured");

  // ─── Kia Sportage configs ─────────────────────────────────────────────
  for (const trim of sportageTrims) {
    const isTop = trim.name === "GT-Line";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" }, { name: "Огненный красный", code: "fire-red", priceDelta: "500" }]
        : [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" }] },
      { type: "interior_color", name: "Цвет салона", items: [{ name: "Чёрная кожа", code: "black-leather", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "0" }] },
      { type: "wheels", name: "Колёса", items: [wheel18, wheel19, wheel19Standard] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optSoundSystem] : [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ Kia Sportage: all trims configured");

  // ─── Kia EV6 configs ──────────────────────────────────────────────────
  for (const trim of ev6Trims) {
    const isTop = trim.name === "GT-Line AWD";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" }, { name: "Огненный красный", code: "fire-red", priceDelta: "500" }, { name: "Зелёный матовый", code: "matte-green", priceDelta: "800" }]
        : [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" }, { name: "Огненный красный", code: "fire-red", priceDelta: "500" }] },
      { type: "interior_color", name: "Цвет салона", items: isTop ? [{ name: "Чёрная кожа", code: "black-leather", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "0" }, { name: "Бежевая кожа", code: "beige-leather", priceDelta: "0" }] : [{ name: "Чёрная кожа", code: "black-leather", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "0" }] },
      { type: "wheels", name: "Колёса", items: wheelsBev },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [optPanoramicRoof, optHud, optSoundSystem] },
    ]);
  }
  console.log("  ✓ Kia EV6: all trims configured");

  // ─── Kia K5 configs ───────────────────────────────────────────────────
  for (const trim of k5Trims) {
    const isTop = trim.name === "GT-Line";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" }, { name: "Огненный красный", code: "fire-red", priceDelta: "500" }]
        : [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "500" }] },
      { type: "interior_color", name: "Цвет салона", items: [{ name: "Чёрная кожа", code: "black-leather", priceDelta: "0" }, { name: "Серая кожа", code: "grey-leather", priceDelta: "0" }] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18, wheel18Sport] },
      { type: "package", name: "Пакеты", required: false, items: isTop ? [pkgPremium] : [] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optHud, optSoundSystem] : [optPanoramicRoof, optHud] },
    ]);
  }
  console.log("  ✓ Kia K5: all trims configured");

  // ─── Kia Sonet configs ────────────────────────────────────────────────
  for (const trim of sonetTrims) {
    const isTop = trim.name === "GT-Line";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "400" }, { name: "Огненный красный", code: "fire-red", priceDelta: "400" }]
        : [{ name: "Гравийный серый", code: "gravel-grey", priceDelta: "0" }, { name: "Снежный белый", code: "snow-white", priceDelta: "0" }, { name: "Звёздный синий", code: "starry-blue", priceDelta: "400" }] },
      { type: "interior_color", name: "Цвет салона", items: [{ name: "Чёрная ткань", code: "black-cloth", priceDelta: "0" }, { name: "Серая ткань", code: "grey-cloth", priceDelta: "0" }] },
      { type: "wheels", name: "Колёса", items: [wheel17, wheel18] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: isTop ? [optPanoramicRoof, optSoundSystem] : [optPanoramicRoof] },
    ]);
  }
  console.log("  ✓ Kia Sonet: all trims configured");

  // ─── Tesla Model 3 configs ────────────────────────────────────────────
  for (const trim of model3Trims) {
    const isTop = trim.name === "Long Range";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: isTop
        ? [colorWhite, colorBlack, { name: "Серый", code: "grey", priceDelta: "1000" }, { name: "Красный", code: "red", priceDelta: "1000" }, { name: "Синий", code: "blue", priceDelta: "1000" }]
        : [colorWhite, colorBlack, { name: "Серый", code: "grey", priceDelta: "1000" }] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, { name: "Белый", code: "white", priceDelta: "1000" }] },
      { type: "wheels", name: "Колёса", items: [{ name: '19" Aero', code: "19-aero", priceDelta: "0" }, { name: '20" Sport', code: "20-sport", priceDelta: "1500" }] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [{ name: "Автопилот", code: "autopilot", priceDelta: "3000" }, ...(isTop ? [{ name: "Полный автопilot (FSD)", code: "fsd", priceDelta: "8000" }] : [])] },
    ]);
  }
  console.log("  ✓ Tesla Model 3: all trims configured");

  // ─── Tesla Model Y configs ────────────────────────────────────────────
  for (const trim of modelYTrims) {
    const isTop = trim.name === "Performance";
    await addConfigOptions(trim.id, [
      { type: "exterior_color", name: "Цвет кузова", items: [colorWhite, colorBlack, { name: "Серый", code: "grey", priceDelta: "1000" }, { name: "Красный", code: "red", priceDelta: "1000" }, { name: "Синий", code: "blue", priceDelta: "1000" }] },
      { type: "interior_color", name: "Цвет салона", items: [intBlack, { name: "Белый", code: "white", priceDelta: "1000" }] },
      { type: "wheels", name: "Колёса", items: [{ name: '19" Gemini', code: "19-gemini", priceDelta: "0" }, { name: '20" Induction', code: "20-induction", priceDelta: "2000" }, ...(isTop ? [{ name: '21" Überturbine', code: "21-uberturbine", priceDelta: "3500" }] : [])] },
      { type: "standalone_option", name: "Дополнительные опции", required: false, items: [{ name: "Автопилот", code: "autopilot", priceDelta: "3000" }, ...(isTop ? [{ name: "Полный автопilot (FSD)", code: "fsd", priceDelta: "8000" }] : [])] },
    ]);
  }
  console.log("  ✓ Tesla Model Y: all trims configured");

  // ─── Reviews ────────────────────────────────────────────────────────────
  await db.insert(reviews).values([
    { name: "Артём Ким", city: "Ташкент", rating: 5, vehicleLabel: "Zeekr 7X AWD", text: "Отличный сервис! Машина приехала в идеальном состоянии. Менеджер всё объяснил, помог с выбором. Доставка заняла 22 дня.", published: true, featured: true, sortOrder: 1 },
    { name: "Дилшод Рустамов", city: "Самарканд", rating: 5, vehicleLabel: "BYD Seal", text: "Долго выбирал между BYD и Zeekr. В итоге взял Seal — отличная машина для города. Калькулятор на сайте показал точную сумму.", published: true, featured: true, sortOrder: 2 },
    { name: "Алексей Петров", city: "Ташкент", rating: 4, vehicleLabel: "Changan CS55 Plus", text: "Хороший кроссовер за свои деньги. Единственное — пришлось подождать чуть дольше обещанного срока. Но в целом доволен.", published: true, featured: true, sortOrder: 3 },
    { name: "Нодирбек Турсунов", city: "Бухара", rating: 5, vehicleLabel: "Zeekr 001 Performance", text: "Мечтал о мощном электромобиле. 001 превзошёл ожидания — разгон бешеный, запас хода отличный. Спасибо TerraAuto за подбор!", published: true, featured: true, sortOrder: 4 },
    { name: "Мария Сидорова", city: "Ташкент", rating: 5, vehicleLabel: "BYD Atto 3", text: "Выбрали Atto 3 для жены — компактный, удобный, экономичный. Ребята помогли с документами, всё быстро оформили.", published: true, featured: false, sortOrder: 5 },
  ]);
  console.log("✓ Reviews: 5 entries");

  // ─── Content Pages ──────────────────────────────────────────────────────
  await db.insert(contentPages).values([
    {
      slug: "how-it-works", title: "Как купить автомобиль", contentHtml: `
        <h2>Процесс покупки автомобиля через TerraAuto</h2>
        <p>Мы сделали процесс покупки автомобиля из-за рубежа максимально простым и прозрачным.</p>
        <h3>1. Выбор автомобиля</h3><p>Просмотрите наш каталог или воспользуйтесь подборщиком.</p>
        <h3>2. Расчёт стоимости</h3><p>Калькулятор покажет полную стоимость автомобиля с доставкой.</p>
        <h3>3. Оформление и доставка</h3><p>После согласования мы организуем покупку, проверку, таможенное оформление и доставку.</p>
        <h3>4. Получение в Ташкенте</h3><p>Получите готовый автомобиль в нашем офисе.</p>`,
      seoTitle: "Как купить автомобиль из Китая — Пошаговая инструкция",
      seoDescription: "Подробная инструкция по покупке автомобиля из Китая через TerraAuto.",
      published: true,
    },
    {
      slug: "about", title: "О компании TerraAuto", contentHtml: `
        <h2>О компании TerraAuto</h2>
        <p>Мы помогаем людям в Узбекистане получить доступ к качественным автомобилям из Китая, Кореи, США и Дубая.</p>
        <h3>Наши преимущества</h3>
        <ul><li>Проверка автомобиля перед покупкой</li><li>Доставка под ключ</li><li>Прозрачные сроки</li><li>Поддержка 24/7</li></ul>`,
      seoTitle: "О компании TerraAuto — Автомобили из Китая",
      seoDescription: "Узнайте больше о компании TerraAuto: наша миссия, преимущества и опыт работы.",
      published: true,
    },
    {
      slug: "contacts", title: "Контакты", contentHtml: `
        <h2>Свяжитесь с нами</h2>
        <h3>Телефон</h3><p>+998 90 123 45 67</p>
        <h3>Telegram</h3><p>@terraauto</p>
        <h3>Email</h3><p>info@terraauto.uz</p>
        <h3>Адрес офиса</h3><p>г. Ташкент, ул. Амира Темура, 108</p>`,
      seoTitle: "Контакты TerraAuto — Свяжитесь с нами",
      seoDescription: "Контактная информация TerraAuto: телефон, Telegram, адрес офиса в Ташкенте.",
      published: true,
    },
  ]).onConflictDoNothing({ target: contentPages.slug });
  console.log("✓ Content pages: 3 entries");

  // ─── Site Settings ──────────────────────────────────────────────────────
  await db.insert(siteSettings).values([
    { key: "hero_title", valueJson: "Автомобили из Китая, Кореи, США и Дубая под заказ" },
    { key: "hero_subtitle", valueJson: "Подберём, проверим, доставим и оформим автомобиль в Узбекистане." },
    { key: "contact_phone", valueJson: "+998 90 123 45 67" },
    { key: "contact_telegram", valueJson: "@terraauto" },
    { key: "contact_address", valueJson: "г. Ташкент, ул. Амира Темура, 108" },
  ]).onConflictDoNothing();
  console.log("✓ Site settings: 5 entries");

  // ─── Demo Customers ────────────────────────────────────────────────────
  const [adminUser] = await db.select().from(users).where(eq(users.email, "admin@terraauto.uz"));
  const [managerUser] = await db.select().from(users).where(eq(users.email, "manager@terraauto.uz"));

  const demoCustomers = await db.insert(customers).values([
    { name: "Алексей Ким", phone: "+998 90 111 22 33", telegram: "@alexey_kim", whatsapp: "+998901112233", preferredContactMethod: "telegram" },
    { name: "Иrina Пак", phone: "+998 91 222 33 44", telegram: "@irina_pak", whatsapp: "+998912223344", preferredContactMethod: "phone" },
    { name: "Дмитрий Чой", phone: "+998 93 333 44 55", telegram: "@dchoi", preferredContactMethod: "whatsapp" },
    { name: "Наталья Ли", phone: "+998 94 444 55 66", telegram: "@natalia_li", preferredContactMethod: "telegram" },
    { name: "Сергей Ван", phone: "+998 90 555 66 77", whatsapp: "+998905556677", preferredContactMethod: "phone" },
    { name: "Анна Цой", phone: "+998 91 666 77 88", telegram: "@anna_choi", preferredContactMethod: "telegram" },
    { name: "Михаил Рю", phone: "+998 93 777 88 99", preferredContactMethod: "phone" },
    { name: "Елена Сон", phone: "+998 94 888 99 00", telegram: "@elena_son", whatsapp: "+998948889900", preferredContactMethod: "whatsapp" },
    { name: "Олег Хан", phone: "+998 90 999 00 11", preferredContactMethod: "phone" },
    { name: "Татьяна Нам", phone: "+998 91 000 11 22", telegram: "@t_nam", preferredContactMethod: "telegram" },
  ]).returning();
  console.log(`✓ Demo customers: ${demoCustomers.length}`);

  // ─── Demo Leads ────────────────────────────────────────────────────────
  const customerIds = demoCustomers.map((c) => c.id);
  const managerId = managerUser?.id || adminUser?.id;

  // Get some trim IDs for leads
  const [zeekr7xTrim] = await db.select().from(trims).where(eq(trims.slug, "7x-standard")).limit(1);
  const [bydAtto3Trim] = await db.select().from(trims).where(eq(trims.slug, "atto-3-base")).limit(1);
  const [teslaModelYTrim] = await db.select().from(trims).where(eq(trims.slug, "model-y-standard")).limit(1);
  const [kiaEv6Trim] = await db.select().from(trims).where(eq(trims.slug, "ev6-standard")).limit(1);
  const [hyundaiIoniq5Trim] = await db.select().from(trims).where(eq(trims.slug, "ioniq-5-standard")).limit(1);
  const [bydDolphinTrim] = await db.select().from(trims).where(eq(trims.slug, "dolphin-base")).limit(1);
  const [changanDeepalTrim] = await db.select().from(trims).where(eq(trims.slug, "deepal-s7-standard")).limit(1);
  const [havalH6Trim] = await db.select().from(trims).where(eq(trims.slug, "h6-base")).limit(1);

  const demoLeads = await db.insert(leads).values([
    { customerId: customerIds[0], assignedManagerId: managerId, status: "new", source: "calculator", estimatedTotalUsd: "42500", comment: "Интересуется электромобилем для семьи" },
    { customerId: customerIds[1], assignedManagerId: managerId, status: "new", source: "website", estimatedTotalUsd: "35000" },
    { customerId: customerIds[2], assignedManagerId: managerId, status: "assigned", source: "whatsapp", estimatedTotalUsd: "38000", comment: "Хочет crossover с большими колёсами" },
    { customerId: customerIds[3], assignedManagerId: managerId, status: "assigned", source: "telegram", estimatedTotalUsd: "52000" },
    { customerId: customerIds[4], assignedManagerId: managerId, status: "contacted", source: "calculator", estimatedTotalUsd: "31000", lastContactAt: new Date() },
    { customerId: customerIds[5], assignedManagerId: managerId, status: "contacted", source: "website", estimatedTotalUsd: "45000", lastContactAt: new Date() },
    { customerId: customerIds[6], assignedManagerId: managerId, status: "qualified", source: "phone", estimatedTotalUsd: "55000", lastContactAt: new Date(), nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
    { customerId: customerIds[7], assignedManagerId: managerId, status: "qualified", source: "whatsapp", estimatedTotalUsd: "28000", lastContactAt: new Date() },
    { customerId: customerIds[8], assignedManagerId: adminUser?.id, status: "quote_sent", source: "calculator", estimatedTotalUsd: "48000", lastContactAt: new Date(), nextFollowUpAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
    { customerId: customerIds[9], assignedManagerId: adminUser?.id, status: "negotiation", source: "website", estimatedTotalUsd: "62000", lastContactAt: new Date() },
    { customerId: customerIds[0], assignedManagerId: managerId, status: "won", source: "calculator", estimatedTotalUsd: "42500", lastContactAt: new Date() },
    { customerId: customerIds[3], assignedManagerId: managerId, status: "lost", source: "telegram", estimatedTotalUsd: "52000", comment: "Выбрал другого поставщика" },
  ]).returning();
  console.log(`✓ Demo leads: ${demoLeads.length}`);

  // ─── Lead Configurations ──────────────────────────────────────────────
  const trimAssignments = [
    { leadIdx: 0, trim: zeekr7xTrim, country: "Китай", condition: "new" },
    { leadIdx: 1, trim: bydAtto3Trim, country: "Китай", condition: "new" },
    { leadIdx: 2, trim: changanDeepalTrim, country: "Китай", condition: "new" },
    { leadIdx: 3, trim: teslaModelYTrim, country: "Корея", condition: "new" },
    { leadIdx: 4, trim: bydDolphinTrim, country: "Китай", condition: "new" },
    { leadIdx: 5, trim: hyundaiIoniq5Trim, country: "Корея", condition: "used" },
    { leadIdx: 6, trim: kiaEv6Trim, country: "Корея", condition: "new" },
    { leadIdx: 7, trim: bydAtto3Trim, country: "Китай", condition: "new" },
    { leadIdx: 8, trim: zeekr7xTrim, country: "Китай", condition: "new" },
    { leadIdx: 9, trim: teslaModelYTrim, country: "США", condition: "used" },
    { leadIdx: 10, trim: zeekr7xTrim, country: "Китай", condition: "new" },
    { leadIdx: 11, trim: havalH6Trim, country: "Китай", condition: "new" },
  ];

  for (const assignment of trimAssignments) {
    if (assignment.trim) {
      await db.insert(leadConfigurations).values({
        leadId: demoLeads[assignment.leadIdx].id,
        trimId: assignment.trim.id,
        brandName: assignment.trim.slug.includes("zeekr") ? "Zeekr" : assignment.trim.slug.includes("byd") ? "BYD" : assignment.trim.slug.includes("tesla") ? "Tesla" : assignment.trim.slug.includes("kia") ? "Kia" : assignment.trim.slug.includes("hyundai") ? "Hyundai" : assignment.trim.slug.includes("changan") ? "Changan" : "Haval",
        modelName: assignment.trim.slug.includes("7x") ? "7X" : assignment.trim.slug.includes("atto") ? "Atto 3" : assignment.trim.slug.includes("dolphin") ? "Dolphin" : assignment.trim.slug.includes("model-y") ? "Model Y" : assignment.trim.slug.includes("ev6") ? "EV6" : assignment.trim.slug.includes("ioniq") ? "Ioniq 5" : assignment.trim.slug.includes("deepal") ? "Deepal S7" : "H6",
        trimName: assignment.trim.name,
        sourceCountry: assignment.country,
        condition: assignment.condition,
      });
    }
  }
  console.log(`✓ Lead configurations: ${trimAssignments.length}`);

  const allTrimArrays = [
    zeekr7xTrims, zeekr001Trims, atto3Trims, sealTrims, hanTrims,
    dolphinTrims, songPlusTrims, tangTrims, qinPlusTrims, yuanUpTrims, chazorTrims,
    cs55Trims, deepalS7Trims,
    tiggo7Trims, tiggo8Trims, omoda5Trims, jaecoo7Trims,
    monjaroTrims, coolrayTrims, emgrandTrims,
    jolionTrims, h6Trims, f7Trims,
    mg4Trims, mgHsTrims,
    tucsonTrims, ioniq5Trims, sonataTrims, cretaTrims,
    sportageTrims, ev6Trims, k5Trims, sonetTrims,
    model3Trims, modelYTrims,
  ];
  const totalTrims = allTrimArrays.reduce((sum, arr) => sum + arr.length, 0);
  const totalModels = allTrimArrays.length;

  console.log("\n✅ Seed completed!");
  console.log("\nLogin credentials:");
  console.log("  Admin:   admin@terraauto.uz / admin123");
  console.log("  Manager: manager@terraauto.uz / manager123");
  console.log(`\nVehicles: ${totalModels} models, ${totalTrims} trims`);
  console.log(`Brands: Zeekr, BYD, Changan, Chery, Geely, Haval, MG, Hyundai, Kia, Tesla`);
  console.log(`Calculation rules: ${calcRules.length}`);
  console.log("Exchange rates: 4");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
