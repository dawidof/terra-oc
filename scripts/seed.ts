import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
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

  console.log(`✓ BYD: Atto 3 (${atto3Trims.length} trims) + Seal (${sealTrims.length} trims) + Han (${hanTrims.length} trims)`);

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

  console.log(`✓ Changan: CS55 Plus (${cs55Trims.length} trims) + Deepal S7 (${deepalS7Trims.length} trims)`);

  // ─── Vehicle Media ──────────────────────────────────────────────────────
  const mediaUrls: Record<string, { url: string; alt: string }> = {
    [zeekr7xVer.id]: { url: "/images/cars/zeekr-7x.jpg", alt: "Zeekr 7X — электрический кроссовер" },
    [zeekr001Ver.id]: { url: "/images/cars/zeekr-001.jpg", alt: "Zeekr 001 — электрический лифтбек" },
    [atto3Ver.id]:    { url: "/images/cars/byd-atto3.jpg", alt: "BYD Atto 3 — компактный электрический кроссовер" },
    [sealVer.id]:     { url: "/images/cars/byd-seal.jpg", alt: "BYD Seal — спортивный электрический седан" },
    [hanVer.id]:      { url: "/images/cars/byd-han.jpg", alt: "BYD Han — флагманский электрический седан" },
    [cs55Ver.id]:     { url: "/images/cars/changan-cs55.jpg", alt: "Changan CS55 Plus — популярный кроссовер" },
    [deepalS7Ver.id]: { url: "/images/cars/deepal-s7.jpg", alt: "Deepal S7 — электрический кроссовер" },
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
  // Uzbekistan import rules for different country/powertrain combinations
  const calcRules = [
    {
      country: "Китай",
      condition: "new",
      powertrain: "bev",
      parametersJson: {
        logistics: 2500,
        customsDutyPercent: 15,
        excisePercent: 0,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "Китай",
      condition: "new",
      powertrain: "petrol",
      parametersJson: {
        logistics: 2000,
        customsDutyPercent: 20,
        excisePercent: 15,
        exciseThresholdCc: 2000,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "Китай",
      condition: "new",
      powertrain: "diesel",
      parametersJson: {
        logistics: 2000,
        customsDutyPercent: 20,
        excisePercent: 15,
        exciseThresholdCc: 2500,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "Китай",
      condition: "new",
      powertrain: "phev",
      parametersJson: {
        logistics: 2500,
        customsDutyPercent: 15,
        excisePercent: 0,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "Китай",
      condition: "used",
      powertrain: "bev",
      parametersJson: {
        logistics: 2500,
        customsDutyPercent: 15,
        excisePercent: 0,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "Китай",
      condition: "used",
      powertrain: "petrol",
      parametersJson: {
        logistics: 2000,
        customsDutyPercent: 20,
        excisePercent: 15,
        exciseThresholdCc: 2000,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "Корея",
      condition: "new",
      powertrain: "bev",
      parametersJson: {
        logistics: 3000,
        customsDutyPercent: 15,
        excisePercent: 0,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
    {
      country: "ОАЭ",
      condition: "new",
      powertrain: "bev",
      parametersJson: {
        logistics: 3500,
        customsDutyPercent: 15,
        excisePercent: 0,
        vatPercent: 12,
        certificationFees: 500,
        serviceFee: 1200,
      },
      formulaVersion: "uz-2024-v1",
    },
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

  // ─── Configuration Option Groups + Options (Zeekr 7X AWD) ──────────────
  const zeekr7xAwd = zeekr7xTrims.find((t) => t.name === "AWD");
  if (zeekr7xAwd) {
    // Exterior colors
    const exteriorGroup = await db.insert(configurationOptionGroups).values({
      trimId: zeekr7xAwd.id,
      type: "exterior_color",
      name: "Цвет кузова",
      required: true,
    }).returning();

    await db.insert(configurationOptions).values([
      { groupId: exteriorGroup[0].id, name: "Стандартный белый", code: "solid-white", priceDelta: "0", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: exteriorGroup[0].id, name: "Матовый серый", code: "matte-grey", priceDelta: "0", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: exteriorGroup[0].id, name: "Чёрный металлик", code: "metallic-black", priceDelta: "500", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: exteriorGroup[0].id, name: "Синий", code: "ocean-blue", priceDelta: "500", priceCurrency: "USD", priceKnown: true, available: true },
    ]);

    // Interior colors
    const interiorGroup = await db.insert(configurationOptionGroups).values({
      trimId: zeekr7xAwd.id,
      type: "interior_color",
      name: "Цвет салона",
      required: true,

    }).returning();

    await db.insert(configurationOptions).values([
      { groupId: interiorGroup[0].id, name: "Чёрная кожа", code: "black-leather", priceDelta: "0", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: interiorGroup[0].id, name: "Бежевая кожа", code: "beige-leather", priceDelta: "0", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: interiorGroup[0].id, name: "Красная кожа", code: "red-leather", priceDelta: "800", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: interiorGroup[0].id, name: "Оранжевый салон", code: "orange-interior", priceDelta: null, priceCurrency: null, priceKnown: false, available: true },
    ]);

    // Wheels
    const wheelsGroup = await db.insert(configurationOptionGroups).values({
      trimId: zeekr7xAwd.id,
      type: "wheels",
      name: "Колёса",
      required: true,

    }).returning();

    await db.insert(configurationOptions).values([
      { groupId: wheelsGroup[0].id, name: '19" стандартные', code: "19-standard", priceDelta: "0", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: wheelsGroup[0].id, name: '20" спортивные', code: "20-sport", priceDelta: "1200", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: wheelsGroup[0].id, name: '21" кованые', code: "21-forged", priceDelta: null, priceCurrency: null, priceKnown: false, available: true },
    ]);

    // Package options
    const packageGroup = await db.insert(configurationOptionGroups).values({
      trimId: zeekr7xAwd.id,
      type: "package",
      name: "Пакеты",
      required: false,

    }).returning();

    await db.insert(configurationOptions).values([
      { groupId: packageGroup[0].id, name: "Пакет «Комфорт»", code: "comfort-package", priceDelta: "2500", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: packageGroup[0].id, name: "Пакет «Премиум»", code: "premium-package", priceDelta: "4500", priceCurrency: "USD", priceKnown: true, available: true },
    ]);

    // Standalone options
    const standaloneGroup = await db.insert(configurationOptionGroups).values({
      trimId: zeekr7xAwd.id,
      type: "standalone_option",
      name: "Дополнительные опции",
      required: false,

    }).returning();

    await db.insert(configurationOptions).values([
      { groupId: standaloneGroup[0].id, name: "Панорамная крыша", code: "panoramic-roof", priceDelta: "1800", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: standaloneGroup[0].id, name: "Холодильник в бардачке", code: "fridge", priceDelta: "600", priceCurrency: "USD", priceKnown: true, available: true },
      { groupId: standaloneGroup[0].id, name: "Проекционный дисплей", code: "hud", priceDelta: "900", priceCurrency: "USD", priceKnown: true, available: true },
    ]);

    console.log("✓ Configuration options: 5 groups, 18 options (Zeekr 7X AWD)");
  }

  // ─── Reviews ────────────────────────────────────────────────────────────
  await db.insert(reviews).values([
    {
      name: "Артём Ким",
      city: "Ташкент",
      rating: 5,
      vehicleLabel: "Zeekr 7X AWD",
      text: "Отличный сервис! Машина приехала в идеальном состоянии. Менеджер всё объяснил, помог с выбором. Доставка заняла 22 дня.",
      published: true,
      featured: true,
      sortOrder: 1,
    },
    {
      name: "Дилшод Рустамов",
      city: "Самарканд",
      rating: 5,
      vehicleLabel: "BYD Seal",
      text: "Долго выбирал между BYD и Zeekr. В итоге взял Seal — отличная машина для города. Калькулятор на сайте показал точную сумму.",
      published: true,
      featured: true,
      sortOrder: 2,
    },
    {
      name: "Алексей Петров",
      city: "Ташкент",
      rating: 4,
      vehicleLabel: "Changan CS55 Plus",
      text: "Хороший кроссовер за свои деньги. Единственное — пришлось подождать чуть дольше обещанного срока. Но в целом доволен.",
      published: true,
      featured: true,
      sortOrder: 3,
    },
    {
      name: "Нодирбек Турсунов",
      city: "Бухара",
      rating: 5,
      vehicleLabel: "Zeekr 001 Performance",
      text: "Мечтал о мощном электромобиле. 001 превзошёл ожидания — разгон бешеный, запас хода отличный. Спасибо TerraAuto за подбор!",
      published: true,
      featured: true,
      sortOrder: 4,
    },
    {
      name: "Мария Сидорова",
      city: "Ташкент",
      rating: 5,
      vehicleLabel: "BYD Atto 3",
      text: "Выбрали Atto 3 для жены — компактный, удобный, экономичный. Ребята помогли с документами, всё быстро оформили.",
      published: true,
      featured: false,
      sortOrder: 5,
    },
  ]);
  console.log("✓ Reviews: 5 entries");

  // ─── Content Pages ──────────────────────────────────────────────────────
  await db.insert(contentPages).values([
    {
      slug: "how-it-works",
      title: "Как купить автомобиль",
      contentHtml: `
        <h2>Процесс покупки автомобиля через TerraAuto</h2>
        <p>Мы сделали процесс покупки автомобиля из-за рубежа максимально простым и прозрачным.</p>

        <h3>1. Выбор автомобиля</h3>
        <p>Просмотрите наш каталог или воспользуйтесь подборщиком. Мы предлагаем автомобили из Китая, Кореи, США и Дубая с полной информацией о комплектации и характеристиках.</p>

        <h3>2. Расчёт стоимости</h3>
        <p>Калькулятор покажет полную стоимость автомобиля с доставкой: цена автомобиля, логистика, таможенные пошлины и сервисный сбор.</p>

        <h3>3. Оформление и доставка</h3>
        <p>После согласования мы организуем покупку, проверку, таможенное оформление и доставку автомобиля в Узбекистан.</p>

        <h3>4. Получение в Ташкенте</h3>
        <p>Получите готовый автомобиль в нашем офисе в Ташкенте. Мы поможем с регистрацией и предоставим все документы.</p>
      `,
      seoTitle: "Как купить автомобиль из Китая — Пошаговая инструкция",
      seoDescription: "Подробная инструкция по покупке автомобиля из Китая через TerraAuto: выбор, расчёт, оформление, доставка.",
      published: true,
    },
    {
      slug: "about",
      title: "О компании TerraAuto",
      contentHtml: `
        <h2>О компании TerraAuto</h2>
        <p>Мы помогаем людям в Узбекистане получить доступ к качественным автомобилям из Китая, Кореи, США и Дубая по прозрачным ценам и с полным сервисом.</p>

        <h3>Наша миссия</h3>
        <p>TerraAuto создана для того, чтобы сделать покупку автомобиля из-за рубежа простой, прозрачной и безопасной. Мы берём на себя весь процесс: от выбора автомобиля до его регистрации в Ташкенте.</p>

        <h3>Наши преимущества</h3>
        <ul>
          <li>Проверка автомобиля перед покупкой</li>
          <li>Доставка под ключ</li>
          <li>Прозрачные сроки</li>
          <li>Поддержка 24/7</li>
        </ul>
      `,
      seoTitle: "О компании TerraAuto — Автомобили из Китая",
      seoDescription: "Узнайте больше о компании TerraAuto: наша миссия, преимущества и опыт работы.",
      published: true,
    },
    {
      slug: "contacts",
      title: "Контакты",
      contentHtml: `
        <h2>Свяжитесь с нами</h2>
        <p>Мы всегда на связи и готовы помочь с выбором автомобиля.</p>

        <h3>Телефон</h3>
        <p>+998 90 123 45 67</p>

        <h3>Telegram</h3>
        <p>@terraauto</p>

        <h3>Email</h3>
        <p>info@terraauto.uz</p>

        <h3>Адрес офиса</h3>
        <p>г. Ташкент, ул. Амира Темура, 108</p>

        <h3>Часы работы</h3>
        <p>Пн–Пт: 9:00–18:00, Сб: 10:00–15:00</p>
      `,
      seoTitle: "Контакты TerraAuto — Свяжитесь с нами",
      seoDescription: "Контактная информация TerraAuto: телефон, Telegram, адрес офиса в Ташкенте.",
      published: true,
    },
  ]);
  console.log("✓ Content pages: 3 entries (how-it-works, about, contacts)");

  // ─── Site Settings ──────────────────────────────────────────────────────
  await db.insert(siteSettings).values([
    { key: "hero_title", valueJson: "Автомобили из Китая, Кореи, США и Дубая под заказ" },
    { key: "hero_subtitle", valueJson: "Подберём, проверим, доставим и оформим автомобиль в Узбекистане." },
    { key: "contact_phone", valueJson: "+998 90 123 45 67" },
    { key: "contact_telegram", valueJson: "@terraauto" },
    { key: "contact_address", valueJson: "г. Ташкент, ул. Амира Темура, 108" },
  ]).onConflictDoNothing();
  console.log("✓ Site settings: 5 entries");

  const totalTrims = zeekr7xTrims.length + zeekr001Trims.length + atto3Trims.length + sealTrims.length + hanTrims.length + cs55Trims.length + deepalS7Trims.length;
  console.log("\n✅ Seed completed!");
  console.log("\nLogin credentials:");
  console.log("  Admin:   admin@terraauto.uz / admin123");
  console.log("  Manager: manager@terraauto.uz / manager123");
  console.log(`\nVehicles: 7 models, ${totalTrims} trims`);
  console.log(`Calculation rules: ${calcRules.length}`);
  console.log("Exchange rates: 4");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
