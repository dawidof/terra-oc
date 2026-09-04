import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  numeric,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "manager"]);

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "assigned",
  "contacted",
  "needs_follow_up",
  "qualified",
  "quote_sent",
  "negotiation",
  "won",
  "lost",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("manager"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── Site Settings ───────────────────────────────────────────────────────────

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  valueJson: jsonb("value_json").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  entityType: varchar("entity_type", { length: 100 }).notNull(),
  entityId: uuid("entity_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Brands ──────────────────────────────────────────────────────────────────

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  country: varchar("country", { length: 100 }),
  logoUrl: text("logo_url"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Car Models ──────────────────────────────────────────────────────────────

export const carModels = pgTable("car_models", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  alternativeNames: jsonb("alternative_names").$type<string[]>().default([]),
  bodyType: varchar("body_type", { length: 50 }),
  description: text("description"),
  shortDescription: text("short_description"),
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Model Versions ─────────────────────────────────────────────────────────

export const modelVersions = pgTable("model_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  carModelId: uuid("car_model_id")
    .notNull()
    .references(() => carModels.id),
  name: varchar("name", { length: 255 }).notNull(),
  generationCode: varchar("generation_code", { length: 100 }),
  modelYearFrom: integer("model_year_from"),
  modelYearTo: integer("model_year_to"),
  productionStatus: varchar("production_status", { length: 50 }),
  defaultSourceCountry: varchar("default_source_country", { length: 100 }),
  seats: integer("seats"),
  doors: integer("doors"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Trims ───────────────────────────────────────────────────────────────────

export const trims = pgTable("trims", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelVersionId: uuid("model_version_id")
    .notNull()
    .references(() => modelVersions.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  powertrainType: varchar("powertrain_type", { length: 50 }),
  drivetrain: varchar("drivetrain", { length: 50 }),
  engineDisplacementCc: integer("engine_displacement_cc"),
  enginePowerHp: integer("engine_power_hp"),
  motorPowerKw: integer("motor_power_kw"),
  batteryCapacityKwh: numeric("battery_capacity_kwh", { precision: 6, scale: 2 }),
  rangeKm: integer("range_km"),
  acceleration0100: numeric("acceleration_0_100", { precision: 4, scale: 2 }),
  topSpeedKmh: integer("top_speed_kmh"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }),
  basePriceCurrency: varchar("base_price_currency", { length: 3 }).default("USD"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Specification Groups ────────────────────────────────────────────────────

export const specificationGroups = pgTable("specification_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── Specification Definitions ──────────────────────────────────────────────

export const specificationDefinitions = pgTable("specification_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => specificationGroups.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  dataType: varchar("data_type", { length: 50 }).notNull().default("string"),
  unit: varchar("unit", { length: 50 }),
  comparisonPriority: integer("comparison_priority").notNull().default(0),
  filterable: boolean("filterable").notNull().default(false),
});

// ─── Trim Specification Values ──────────────────────────────────────────────

export const trimSpecificationValues = pgTable("trim_specification_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  trimId: uuid("trim_id")
    .notNull()
    .references(() => trims.id),
  specificationDefinitionId: uuid("specification_definition_id")
    .notNull()
    .references(() => specificationDefinitions.id),
  valueText: text("value_text"),
  valueNumber: numeric("value_number", { precision: 12, scale: 4 }),
  valueBoolean: boolean("value_boolean"),
  sourceNote: text("source_note"),
});

// ─── Vehicle Media ──────────────────────────────────────────────────────────

export const vehicleMedia = pgTable("vehicle_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelVersionId: uuid("model_version_id")
    .notNull()
    .references(() => modelVersions.id),
  trimId: uuid("trim_id").references(() => trims.id),
  type: varchar("type", { length: 50 }).notNull().default("exterior"),
  url: text("url").notNull(),
  storageKey: text("storage_key"),
  alt: text("alt"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Vehicle Offers ─────────────────────────────────────────────────────────

export const vehicleOffers = pgTable("vehicle_offers", {
  id: uuid("id").primaryKey().defaultRandom(),
  trimId: uuid("trim_id")
    .notNull()
    .references(() => trims.id),
  sourceCountry: varchar("source_country", { length: 100 }),
  condition: varchar("condition", { length: 50 }),
  modelYear: integer("model_year"),
  mileageKm: integer("mileage_km"),
  sourcePrice: numeric("source_price", { precision: 12, scale: 2 }),
  sourceCurrency: varchar("source_currency", { length: 3 }).default("USD"),
  priceBasis: varchar("price_basis", { length: 50 }),
  estimatedLogistics: numeric("estimated_logistics", { precision: 12, scale: 2 }),
  estimatedCustoms: numeric("estimated_customs", { precision: 12, scale: 2 }),
  estimatedServiceFee: numeric("estimated_service_fee", { precision: 12, scale: 2 }),
  estimatedTotalUsd: numeric("estimated_total_usd", { precision: 12, scale: 2 }),
  deliveryDays: integer("delivery_days"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Used Vehicle Details ───────────────────────────────────────────────────

export const usedVehicleDetails = pgTable("used_vehicle_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => vehicleOffers.id),
  vin: varchar("vin", { length: 17 }),
  manufactureDate: timestamp("manufacture_date"),
  firstRegistrationDate: timestamp("first_registration_date"),
  mileageKm: integer("mileage_km"),
  ownersCount: integer("owners_count"),
  auctionGrade: varchar("auction_grade", { length: 10 }),
  accidentStatus: varchar("accident_status", { length: 50 }),
});

// ─── Configuration Option Groups ────────────────────────────────────────────

export const configurationOptionGroups = pgTable("configuration_option_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  trimId: uuid("trim_id")
    .notNull()
    .references(() => trims.id),
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  required: boolean("required").notNull().default(false),
});

// ─── Configuration Options ──────────────────────────────────────────────────

export const configurationOptions = pgTable("configuration_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => configurationOptionGroups.id),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }),
  imageUrl: text("image_url"),
  priceDelta: numeric("price_delta", { precision: 12, scale: 2 }),
  priceCurrency: varchar("price_currency", { length: 3 }).default("USD"),
  priceKnown: boolean("price_known").notNull().default(true),
  available: boolean("available").notNull().default(true),
});

// ─── Reviews ────────────────────────────────────────────────────────────────

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }),
  rating: integer("rating"),
  vehicleLabel: varchar("vehicle_label", { length: 255 }),
  text: text("text"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  socialUrl: text("social_url"),
  published: boolean("published").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Calculation Rule Versions ──────────────────────────────────────────────

export const calculationRuleVersions = pgTable("calculation_rule_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  country: varchar("country", { length: 100 }).notNull(),
  condition: varchar("condition", { length: 50 }).notNull(),
  powertrain: varchar("powertrain", { length: 50 }).notNull(),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validTo: timestamp("valid_to", { withTimezone: true }),
  parametersJson: jsonb("parameters_json").notNull(),
  formulaVersion: varchar("formula_version", { length: 50 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Exchange Rates ─────────────────────────────────────────────────────────

export const exchangeRates = pgTable("exchange_rates", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
  toCurrency: varchar("to_currency", { length: 3 }).notNull().default("USD"),
  rate: numeric("rate", { precision: 12, scale: 6 }).notNull(),
  source: varchar("source", { length: 100 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Customers ──────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  phoneNormalized: varchar("phone_normalized", { length: 50 }),
  telegram: varchar("telegram", { length: 255 }),
  whatsapp: varchar("whatsapp", { length: 255 }),
  email: varchar("email", { length: 255 }),
  preferredContactMethod: varchar("preferred_contact_method", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── Leads ──────────────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  assignedManagerId: uuid("assigned_manager_id").references(() => users.id),
  status: leadStatusEnum("status").notNull().default("new"),
  source: varchar("source", { length: 100 }),
  trimId: uuid("trim_id").references(() => trims.id),
  estimatedTotalUsd: numeric("estimated_total_usd", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  comment: text("comment"),
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  referrer: text("referrer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  nextFollowUpAt: timestamp("next_follow_up_at", { withTimezone: true }),
});

// ─── Lead Configurations ────────────────────────────────────────────────────

export const leadConfigurations = pgTable("lead_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),
  brandName: varchar("brand_name", { length: 255 }),
  modelName: varchar("model_name", { length: 255 }),
  modelVersionName: varchar("model_version_name", { length: 255 }),
  trimName: varchar("trim_name", { length: 255 }),
  sourceCountry: varchar("source_country", { length: 100 }),
  condition: varchar("condition", { length: 50 }),
  configurationJson: jsonb("configuration_json"),
  sourcePrice: numeric("source_price", { precision: 12, scale: 2 }),
  sourceCurrency: varchar("source_currency", { length: 3 }),
  logisticsCost: numeric("logistics_cost", { precision: 12, scale: 2 }),
  customsCost: numeric("customs_cost", { precision: 12, scale: 2 }),
  serviceFee: numeric("service_fee", { precision: 12, scale: 2 }),
  otherCosts: numeric("other_costs", { precision: 12, scale: 2 }),
  estimatedTotal: numeric("estimated_total", { precision: 12, scale: 2 }),
  exchangeRate: numeric("exchange_rate", { precision: 12, scale: 6 }),
  calculatorRuleVersion: varchar("calculator_rule_version", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Lead Notes ─────────────────────────────────────────────────────────────

export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Lead Activities ────────────────────────────────────────────────────────

export const leadActivities = pgTable("lead_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id),
  userId: uuid("user_id").references(() => users.id),
  type: varchar("type", { length: 100 }).notNull(),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Content Pages ──────────────────────────────────────────────────────────

export const contentPages = pgTable("content_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  contentHtml: text("content_html"),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: text("seo_description"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
