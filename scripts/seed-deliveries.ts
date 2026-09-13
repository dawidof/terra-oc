import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { customers, users, trims } from "../src/db/schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

const SOURCES = ["phone", "telegram", "whatsapp", "configurator", "calculator", "manager"] as const;

interface LeadSeed {
  trimSlug: string;
  customerIdx: number;
  status: string;
  source: typeof SOURCES[number];
  location: string;
  vin: string;
  expectedDays: number;
  leadStatus: string;
  comment: string;
  config: {
    brandName: string;
    modelName: string;
    trimName: string;
    sourceCountry: string;
    condition: string;
    sourcePrice: string;
    logisticsCost: string;
    customsCost: string;
    serviceFee: string;
    estimatedTotal: string;
  };
}

const leadsData: LeadSeed[] = [
  {
    trimSlug: "zeekr-7x-long-range",
    customerIdx: 0,
    status: "in_transit",
    source: "phone",
    location: "Шанхай, Китай",
    vin: "LRW2E6FA5NC123001",
    expectedDays: 10,
    leadStatus: "quote_sent",
    comment: "Клиент хочет Zeekr 7X Long Range, ждёт к 15 сентября. Интересуется extended warranty.",
    config: { brandName: "Zeekr", modelName: "7X", trimName: "Long Range", sourceCountry: "Китай", condition: "new", sourcePrice: "34990", logisticsCost: "3000", customsCost: "4500", serviceFee: "1500", estimatedTotal: "43990" },
  },
  {
    trimSlug: "zeekr-7x-awd",
    customerIdx: 1,
    status: "reserved",
    source: "telegram",
    location: "Ташкент, склад",
    vin: "LRW2E6FA5NC123002",
    expectedDays: 0,
    leadStatus: "negotiation",
    comment: "Написал в Telegram, хочет AWD версию. Забронировали из наличия.",
    config: { brandName: "Zeekr", modelName: "7X", trimName: "AWD", sourceCountry: "Китай", condition: "new", sourcePrice: "39990", logisticsCost: "3000", customsCost: "4500", serviceFee: "1500", estimatedTotal: "48990" },
  },
  {
    trimSlug: "byd-atto3-comfort",
    customerIdx: 2,
    status: "in_transit",
    source: "configurator",
    location: "Шанхай, порт",
    vin: "LGXCE6CB5R0123001",
    expectedDays: 15,
    leadStatus: "contacted",
    comment: "Собрал конфигурацию на сайте, выбрал Comfort. Позвонил, подтвердил заказ.",
    config: { brandName: "BYD", modelName: "Atto 3", trimName: "Comfort", sourceCountry: "Китай", condition: "new", sourcePrice: "25490", logisticsCost: "2500", customsCost: "3500", serviceFee: "1500", estimatedTotal: "32990" },
  },
  {
    trimSlug: "byd-seal-design",
    customerIdx: 3,
    status: "on_order",
    source: "calculator",
    location: "Завод BYD, Шэньчжэнь",
    vin: "",
    expectedDays: 30,
    leadStatus: "qualified",
    comment: "Рассчитал стоимость на калькуляторе. Выбрал Design, ожидаем с завода.",
    config: { brandName: "BYD", modelName: "Seal", trimName: "Design", sourceCountry: "Китай", condition: "new", sourcePrice: "31990", logisticsCost: "3000", customsCost: "4000", serviceFee: "1500", estimatedTotal: "40490" },
  },
  {
    trimSlug: "byd-seal-awd",
    customerIdx: 4,
    status: "sold",
    source: "whatsapp",
    location: "Ташкент, выдан клиенту",
    vin: "LGXCE6CB5R0123003",
    expectedDays: 0,
    leadStatus: "won",
    comment: "Написал в WhatsApp. Быстро договорились, автомобиль выдан.",
    config: { brandName: "BYD", modelName: "Seal", trimName: "AWD", sourceCountry: "Китай", condition: "new", sourcePrice: "37990", logisticsCost: "3000", customsCost: "4000", serviceFee: "1500", estimatedTotal: "46490" },
  },
  {
    trimSlug: "cs55-plus-luxury",
    customerIdx: 5,
    status: "in_transit",
    source: "manager",
    location: "Чунцин, Китай",
    vin: "LS5A3ADE5R0123001",
    expectedDays: 12,
    leadStatus: "quote_sent",
    comment: "Оставил заявку на сайте. Бензиновый, для семьи —推荐 CS55 Plus Luxury.",
    config: { brandName: "Changan", modelName: "CS55 Plus", trimName: "Luxury", sourceCountry: "Китай", condition: "new", sourcePrice: "17490", logisticsCost: "2000", customsCost: "3000", serviceFee: "1500", estimatedTotal: "23990" },
  },
  {
    trimSlug: "hyundai-tucson-style",
    customerIdx: 6,
    status: "reserved",
    source: "phone",
    location: "Ташкент, склад",
    vin: "KM8JBDA15RA123001",
    expectedDays: 0,
    leadStatus: "negotiation",
    comment: "Позвонил, сравнивал с Kia Sportage. Выбрал Tucson Style. Забронировали.",
    config: { brandName: "Hyundai", modelName: "Tucson", trimName: "Style", sourceCountry: "Корея", condition: "new", sourcePrice: "27490", logisticsCost: "3000", customsCost: "4000", serviceFee: "1500", estimatedTotal: "35990" },
  },
  {
    trimSlug: "kia-sportage-prestige",
    customerIdx: 7,
    status: "on_order",
    source: "telegram",
    location: "Ульсан, Корея",
    vin: "",
    expectedDays: 25,
    leadStatus: "assigned",
    comment: "Пишет в Telegram, хочет Kia Prestige. Ожидаем с завода.",
    config: { brandName: "Kia", modelName: "Sportage", trimName: "Prestige", sourceCountry: "Корея", condition: "new", sourcePrice: "27490", logisticsCost: "3000", customsCost: "4000", serviceFee: "1500", estimatedTotal: "35990" },
  },
  {
    trimSlug: "geely-monjaro-premium",
    customerIdx: 0,
    status: "in_transit",
    source: "phone",
    location: "Нинбо, Китай",
    vin: "LB37722Z5R0123001",
    expectedDays: 18,
    leadStatus: "qualified",
    comment: "Тот же клиент (Исхонов), заказывает второй автомобиль — Monjaro Premium AWD.",
    config: { brandName: "Geely", modelName: "Monjaro", trimName: "Premium", sourceCountry: "Китай", condition: "new", sourcePrice: "28490", logisticsCost: "3000", customsCost: "4000", serviceFee: "1500", estimatedTotal: "36990" },
  },
  {
    trimSlug: "tesla-modely-lr",
    customerIdx: 2,
    status: "on_order",
    source: "configurator",
    location: "Шанхай, Tesla Gigafactory",
    vin: "",
    expectedDays: 35,
    leadStatus: "quote_sent",
    comment: "Собрал Model Y LR на конфигураторе. Ждём доставку из Китая.",
    config: { brandName: "Tesla", modelName: "Model Y", trimName: "Long Range", sourceCountry: "Китай", condition: "new", sourcePrice: "47990", logisticsCost: "4000", customsCost: "5500", serviceFee: "1500", estimatedTotal: "58990" },
  },
];

async function seedDeliveries() {
  console.log("Cleaning old seed data...");
  await client.unsafe(`DELETE FROM lead_activities WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM lead_notes WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM lead_payments WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM lead_media WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM lead_configurations WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM lead_proposed_cars WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM quotes WHERE lead_id IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM vehicle_inventory WHERE reserved_by IN (SELECT id FROM leads WHERE source = 'seed')`);
  await client.unsafe(`DELETE FROM leads WHERE source = 'seed'`);
  console.log("✓ Old seed data cleaned\n");

  const manager = (
    await db.select().from(users).where(eq(users.email, "manager@terraauto.uz")).limit(1)
  )[0];
  if (!manager) {
    console.error("Manager user not found. Run seed.ts first.");
    process.exit(1);
  }
  console.log(`✓ Manager: ${manager.name}`);

  const sampleCustomers = [
    { name: "Исхонов Абдулла", phone: "+998 90 111 22 33", phoneNormalized: "+998901112233", telegram: "@abdulloh_uz" },
    { name: "Каримов Дилшод", phone: "+998 91 222 33 44", phoneNormalized: "+998912223344", whatsapp: "+998912223344" },
    { name: "Рустамов Жамшид", phone: "+998 93 333 44 55", phoneNormalized: "+998933334455", telegram: "@jamshid_r" },
    { name: "Мирзоев Бекзод", phone: "+998 94 444 55 66", phoneNormalized: "+998944445566", email: "bekzod.m@gmail.com" },
    { name: "Хасанов Рустам", phone: "+998 97 555 66 77", phoneNormalized: "+998975556677", telegram: "@rustam_h" },
    { name: "Назаров Дильмурод", phone: "+998 90 666 77 88", phoneNormalized: "+998906667788" },
    { name: "Турсунов Ойбек", phone: "+998 91 777 88 99", phoneNormalized: "+998917778899", whatsapp: "+998917778899" },
    { name: "Ахмедов Шерзод", phone: "+998 93 888 99 00", phoneNormalized: "+998938889900", telegram: "@sherzod_a" },
  ];

  const insertedCustomers = [];
  for (const c of sampleCustomers) {
    const existing = (
      await db.select().from(customers).where(eq(customers.phone, c.phone)).limit(1)
    )[0];
    if (existing) {
      insertedCustomers.push(existing);
    } else {
      const [row] = await db.insert(customers).values(c).returning();
      insertedCustomers.push(row);
    }
  }
  console.log(`✓ Customers: ${insertedCustomers.length}\n`);

  let insertedLeads = 0;
  let insertedConfigs = 0;
  let insertedInventory = 0;
  let insertedActivities = 0;

  for (const d of leadsData) {
    const trim = (
      await db.select().from(trims).where(eq(trims.slug, d.trimSlug)).limit(1)
    )[0];
    if (!trim) {
      console.log(`  ⚠ Trim "${d.trimSlug}" not found, skipping`);
      continue;
    }
    const customer = insertedCustomers[d.customerIdx];

    const [lead] = await client.unsafe(
      `INSERT INTO leads (customer_id, assigned_manager_id, status, source, trim_id, estimated_total_usd, currency, comment)
       VALUES ($1, $2, $3, $4, $5, $6, 'USD', $7) RETURNING id`,
      [customer.id, manager.id, d.leadStatus, d.source, trim.id, d.config.estimatedTotal, d.comment],
    );
    insertedLeads++;

    await client.unsafe(
      `INSERT INTO lead_configurations (lead_id, brand_name, model_name, trim_name, source_country, condition, source_price, source_currency, logistics_cost, customs_cost, service_fee, estimated_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9, $10, $11)`,
      [lead.id, d.config.brandName, d.config.modelName, d.config.trimName, d.config.sourceCountry, d.config.condition, d.config.sourcePrice, d.config.logisticsCost, d.config.customsCost, d.config.serviceFee, d.config.estimatedTotal],
    );
    insertedConfigs++;

    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + d.expectedDays);
    await client.unsafe(
      `INSERT INTO vehicle_inventory (trim_id, status, location, vin, expected_date, reserved_by, reserved_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        trim.id,
        d.status,
        d.location,
        d.vin || null,
        d.expectedDays > 0 ? expectedDate.toISOString() : null,
        lead.id,
        d.status === "reserved" || d.status === "sold" ? new Date().toISOString() : null,
        d.comment || null,
      ],
    );
    insertedInventory++;

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 14));
    await client.unsafe(
      `INSERT INTO lead_activities (lead_id, user_id, type, metadata_json, created_at)
       VALUES ($1, $2, 'created', $3, $4)`,
      [lead.id, manager.id, JSON.stringify({ source: d.source }), createdAt.toISOString()],
    );
    insertedActivities++;

    if (d.leadStatus !== "new") {
      const statusAt = new Date(createdAt);
      statusAt.setHours(statusAt.getHours() + Math.floor(Math.random() * 24));
      await client.unsafe(
        `INSERT INTO lead_activities (lead_id, user_id, type, metadata_json, created_at)
         VALUES ($1, $2, 'status_changed', $3, $4)`,
        [lead.id, manager.id, JSON.stringify({ newStatus: d.leadStatus }), statusAt.toISOString()],
      );
      insertedActivities++;
    }

    if (d.status === "reserved" || d.status === "sold") {
      const reserveAt = new Date(createdAt);
      reserveAt.setDate(reserveAt.getDate() + 1);
      await client.unsafe(
        `INSERT INTO lead_activities (lead_id, user_id, type, metadata_json, created_at)
         VALUES ($1, $2, 'vehicle_reserved', $3, $4)`,
        [lead.id, manager.id, JSON.stringify({ trimName: d.config.trimName, location: d.location }), reserveAt.toISOString()],
      );
      insertedActivities++;
    }
  }

  console.log(`✓ Leads created: ${insertedLeads}`);
  console.log(`✓ Configurations created: ${insertedConfigs}`);
  console.log(`✓ Inventory items created: ${insertedInventory}`);
  console.log(`✓ Activities created: ${insertedActivities}`);
  console.log("\nDone! Leads are now visible at /crm/leads with full config data");

  await client.end();
}

seedDeliveries().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
