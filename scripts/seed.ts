import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
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
} from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  // ─── Admin user ──────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@terraauto.uz",
      passwordHash: adminHash,
      name: "Админ",
      role: "admin",
    })
    .returning();
  console.log(`✓ Admin: ${admin.email}`);

  // ─── Manager user ────────────────────────────────────────────────────────
  const managerHash = await bcrypt.hash("manager123", 10);
  const [manager] = await db
    .insert(users)
    .values({
      email: "manager@terraauto.uz",
      passwordHash: managerHash,
      name: "Менеджер",
      role: "manager",
    })
    .returning();
  console.log(`✓ Manager: ${manager.email}`);

  // ─── Site settings ───────────────────────────────────────────────────────
  const settings = [
    { key: "phone", valueJson: "+998 90 123 45 67" },
    { key: "telegram", valueJson: "https://t.me/terraauto_" },
    { key: "instagram", valueJson: "https://instagram.com/terraauto_" },
    { key: "youtube", valueJson: "https://youtube.com/@TerraAutoUz" },
    {
      key: "office_address",
      valueJson: "г. Ташкент, Сергелийский район, рынок Автосохото",
    },
    {
      key: "disclaimer",
      valueJson:
        "Все цены являются ориентировочными. Итоговая стоимость может измениться в зависимости от курса валют и условий поставки.",
    },
  ];

  for (const setting of settings) {
    await db.insert(siteSettings).values(setting);
  }
  console.log(`✓ Site settings: ${settings.length} entries`);

  // ─── Specification groups ────────────────────────────────────────────────
  const specGroups = await db
    .insert(specificationGroups)
    .values([
      { name: "Основные характеристики", slug: "basic", sortOrder: 1 },
      { name: "Габариты", slug: "dimensions", sortOrder: 2 },
      { name: "Двигатель", slug: "engine", sortOrder: 3 },
      { name: "Батарея", slug: "battery", sortOrder: 4 },
      { name: "Зарядка", slug: "charging", sortOrder: 5 },
      { name: "Подвеска", slug: "suspension", sortOrder: 6 },
      { name: "Безопасность", slug: "safety", sortOrder: 7 },
      { name: "Комфорт", slug: "comfort", sortOrder: 8 },
      { name: "Мультимедиа", slug: "multimedia", sortOrder: 9 },
      { name: "Экстерьер", slug: "exterior", sortOrder: 10 },
    ])
    .returning();
  console.log(`✓ Specification groups: ${specGroups.length}`);

  // ─── Specification definitions ───────────────────────────────────────────
  const specDefs = await db
    .insert(specificationDefinitions)
    .values([
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
    ])
    .returning();
  console.log(`✓ Specification definitions: ${specDefs.length}`);

  // ─── Brand: Zeekr ────────────────────────────────────────────────────────
  const [brand] = await db
    .insert(brands)
    .values({
      name: "Zeekr",
      slug: "zeekr",
      country: "Китай",
      description: "Электромобили премиум-класса от Geely",
    })
    .returning();
  console.log(`✓ Brand: ${brand.name}`);

  // ─── Car Model: Zeekr 7X ────────────────────────────────────────────────
  const [carModel] = await db
    .insert(carModels)
    .values({
      brandId: brand.id,
      name: "7X",
      slug: "7x",
      bodyType: "SUV",
      shortDescription: "Электрический кроссовер премиум-класса",
      featured: true,
    })
    .returning();
  console.log(`✓ Car Model: ${carModel.name}`);

  // ─── Model Version ───────────────────────────────────────────────────────
  const [modelVersion] = await db
    .insert(modelVersions)
    .values({
      carModelId: carModel.id,
      name: "2024",
      generationCode: "2024",
      modelYearFrom: 2024,
      productionStatus: "production",
      defaultSourceCountry: "Китай",
      seats: 5,
      doors: 5,
    })
    .returning();
  console.log(`✓ Model Version: ${modelVersion.name}`);

  // ─── Trims ───────────────────────────────────────────────────────────────
  const trimData = [
    {
      name: "SE",
      slug: "zeekr-7x-se",
      powertrainType: "bev",
      drivetrain: "RWD",
      motorPowerKw: 310,
      batteryCapacityKwh: "75.6",
      rangeKm: 510,
      acceleration0100: "5.80",
      basePrice: "33990",
    },
    {
      name: "Long Range",
      slug: "zeekr-7x-long-range",
      powertrainType: "bev",
      drivetrain: "RWD",
      motorPowerKw: 310,
      batteryCapacityKwh: "100.0",
      rangeKm: 615,
      acceleration0100: "5.80",
      basePrice: "37990",
    },
    {
      name: "AWD",
      slug: "zeekr-7x-awd",
      powertrainType: "bev",
      drivetrain: "AWD",
      motorPowerKw: 440,
      batteryCapacityKwh: "100.0",
      rangeKm: 580,
      acceleration0100: "3.80",
      basePrice: "42990",
    },
    {
      name: "Performance",
      slug: "zeekr-7x-performance",
      powertrainType: "bev",
      drivetrain: "AWD",
      motorPowerKw: 580,
      batteryCapacityKwh: "100.0",
      rangeKm: 540,
      acceleration0100: "3.50",
      basePrice: "47990",
    },
  ];

  const insertedTrims = [];
  for (const trim of trimData) {
    const [inserted] = await db
      .insert(trims)
      .values({
        modelVersionId: modelVersion.id,
        ...trim,
      })
      .returning();
    insertedTrims.push(inserted);
  }
  console.log(`✓ Trims: ${insertedTrims.length}`);

  // ─── Vehicle Offers ──────────────────────────────────────────────────────
  for (const trim of insertedTrims) {
    await db.insert(vehicleOffers).values({
      trimId: trim.id,
      sourceCountry: "Китай",
      condition: "new",
      modelYear: 2024,
      sourcePrice: trim.basePrice,
      sourceCurrency: "USD",
      priceBasis: "CIF",
      estimatedLogistics: "3000",
      estimatedCustoms: "4500",
      estimatedServiceFee: "1500",
      estimatedTotalUsd: String(
        Number(trim.basePrice) + 3000 + 4500 + 1500
      ),
      deliveryDays: 25,
    });
  }
  console.log(`✓ Vehicle offers: ${insertedTrims.length}`);

  // ─── Vehicle Media ──────────────────────────────────────────────────────
  await db.insert(vehicleMedia).values({
    modelVersionId: modelVersion.id,
    type: "exterior",
    url: "https://example.com/zeekr-7x-front.jpg",
    alt: "Zeekr 7X — вид спереди",
    sortOrder: 1,
  });
  console.log("✓ Vehicle media: 1");

  console.log("\n✅ Seed completed!");
  console.log("\nLogin credentials:");
  console.log("  Admin:   admin@terraauto.uz / admin123");
  console.log("  Manager: manager@terraauto.uz / manager123");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
