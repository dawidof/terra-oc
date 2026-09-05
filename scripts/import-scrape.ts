import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import type { RawVehicleData, RawTrim } from "../src/lib/normalizer";
import { normalizeDrivetrain, normalizePowertrain, normalizeBodyType, parseNumber, parsePrice, generateSlug } from "../src/lib/normalizer";
import { importUrls } from "../src/db/schema";

const DATA_DIR = path.join(process.cwd(), "data");
const URLS_FILE = path.join(DATA_DIR, "urls.txt");
const RAW_DIR = path.join(DATA_DIR, "raw");

const DELAY_MS = 1500;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadUrls(): string[] {
  if (!fs.existsSync(URLS_FILE)) {
    return [];
  }
  const content = fs.readFileSync(URLS_FILE, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

async function loadUrlsFromDb(): Promise<string[]> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return [];

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const rows = await db
      .select({ url: importUrls.url })
      .from(importUrls)
      .where(eq(importUrls.status, "pending"));

    return rows.map((r) => r.url);
  } catch {
    return [];
  } finally {
    await client.end();
  }
}

async function updateUrlStatus(url: string, status: string, errorMessage?: string) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    await db
      .update(importUrls)
      .set({ status, errorMessage: errorMessage || null, updatedAt: new Date() })
      .where(eq(importUrls.url, url));
  } catch {
    // ignore
  } finally {
    await client.end();
  }
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    if (!res.ok) {
      console.error(`  ❌ HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`  ❌ Fetch error for ${url}: ${(err as Error).message}`);
    return null;
  }
}

// ─── Gonzo-specific parsing ─────────────────────────────────────────────

function isGonzoUrl(url: string): boolean {
  return url.includes("gonzo-motors.uz");
}

function extractGonzoVehicleData(html: string, url: string): RawVehicleData | null {
  const $ = cheerio.load(html);
  const title = $("title").text().trim() || $("h1").first().text().trim();

  const brand = extractGonzoBrand($, title);
  const model = extractGonzoModel($, title);

  if (!brand || !model) {
    console.log(`  ⚠ Could not determine brand/model from: ${title}`);
    return null;
  }

  const trims = extractGonzoTrims($, url);
  const specGroups = extractGonzoSpecGroups($);

  return {
    sourceUrl: url,
    sourceSite: "gonzo-motors.uz",
    title,
    brand,
    model,
    trims,
    scrapedAt: new Date().toISOString(),
    specGroups: specGroups || undefined,
  };
}

function extractGonzoBrand($: cheerio.CheerioAPI, title: string): string | null {
  const knownBrands = [
    "Zeekr", "BYD", "Changan", "Geely", "Chery", "Haval", "MG",
    "BMW", "Mercedes", "Audi", "Toyota", "Hyundai", "Kia",
    "Tesla", "Nio", "Xpeng", "Li Auto", "Deepal", "Avatr",
    "Lynk", "Proton", "Jetour", "Omoda", "Jaecoo", "Voyah",
  ];

  const text = title + " " + $("h1").first().text();
  for (const brand of knownBrands) {
    if (text.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  const metaContent = $('meta[name="description"]').attr("content") || "";
  for (const brand of knownBrands) {
    if (metaContent.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}

function extractGonzoModel($: cheerio.CheerioAPI, title: string): string | null {
  const h1 = $("h1").first().text().trim();
  const text = h1 || title;

  const cleaned = text
    .replace(/(?:купить|цена|в наличии|в ташкенте|в узбекистане|доставка|официальный|дилер|авто|автомобиль)/gi, "")
    .trim();

  const modelMatch = cleaned.match(/^[\w\s]+?\s+((?:[\w]+\s*)+(?:\d{4})?)/i);
  if (modelMatch) {
    return modelMatch[1].trim();
  }

  const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
  if (words.length >= 2) {
    return words.slice(0, 3).join(" ");
  }

  return null;
}

function extractGonzoTrims($: cheerio.CheerioAPI, url: string): RawTrim[] {
  const trims: RawTrim[] = [];

  // Extract trim names and prices from the page content
  // Look for patterns like "7X 75kW RWD Max - 35.800$"
  const priceBlocks = $("body").text();
  const pricePattern = /(\w[\w\s]+(?:RWD|AWD|4WD|2WD|Max|Ultra|Smart|Performance|Standard|Base|Pro|Plus|Elite|Comfort|Luxury)[\w\s]*)\s*[-–]\s*(\d[\d.,]*)\s*\$/gi;
  let match;
  while ((match = pricePattern.exec(priceBlocks)) !== null) {
    const name = match[1].trim();
    const priceStr = match[2].replace(/[.,](?=\d{3})/g, "");
    const priceData = parsePrice(priceStr + "$");

    if (name && name.length < 100) {
      trims.push({
        name,
        price: priceData ? String(priceData.amount) : null,
        priceCurrency: "USD",
        priceBasis: "CIP",
        powertrainType: "bev",
        drivetrain: normalizeDrivetrain(name.includes("RWD") ? "задний" : name.includes("AWD") || name.includes("4WD") ? "полноприводный" : null),
        motorPowerKw: parseNumber(name.match(/(\d+)\s*kW/i)?.[1] || null),
        enginePowerHp: null,
        engineDisplacementCc: null,
        batteryCapacityKwh: parseNumber(name.match(/(\d+)\s*kWh/i)?.[1] || null),
        rangeKm: null,
        acceleration0100: null,
        bodyType: "SUV",
        seats: 5,
        description: "",
        imageUrls: [],
        specs: {},
        rawSpecs: {},
      });
    }
  }

  // Fallback: if no trims found from price patterns, try the table data
  if (trims.length === 0) {
    const firstTable = $(".t431__data-part1").first().text().trim();
    if (firstTable) {
      const headerParts = firstTable.split(";").map((s) => s.trim()).filter(Boolean);
      // First part is "Комплектация", rest are trim names
      const trimNames = headerParts.slice(1);
      for (const name of trimNames) {
        if (name && name.length < 100) {
          trims.push({
            name,
            price: null,
            priceCurrency: "USD",
            priceBasis: "CIP",
            powertrainType: "bev",
            drivetrain: normalizeDrivetrain(name.includes("RWD") || name.includes("2WD") ? "задний" : name.includes("AWD") || name.includes("4WD") ? "полноприводный" : null),
            motorPowerKw: null,
            enginePowerHp: null,
            engineDisplacementCc: null,
            batteryCapacityKwh: parseNumber(name.match(/(\d+)\s*kWh/i)?.[1] || null),
            rangeKm: null,
            acceleration0100: null,
            bodyType: "SUV",
            seats: 5,
            description: "",
            imageUrls: [],
            specs: {},
            rawSpecs: {},
          });
        }
      }
    }
  }

  // Extract spec data from tables and merge into trims
  const specGroups = extractGonzoSpecGroups($);
  if (specGroups && trims.length > 0) {
    // Merge specs into trims
    for (const groupName of Object.keys(specGroups)) {
      const rows = specGroups[groupName];
      for (const row of rows) {
        const specName = row["__specName"];
        if (!specName) continue;

        for (let i = 0; i < trims.length; i++) {
          const trimName = trims[i].name;
          const value = row[trimName] || row[`col_${i}`] || null;
          if (value && value !== "+" && value !== "-") {
            trims[i].specs[specName] = value;
            trims[i].rawSpecs[specName] = value;
          }
        }
      }
    }
  }

  return trims;
}

function extractGonzoSpecGroups($: cheerio.CheerioAPI): Record<string, Record<string, string | null>[]> | null {
  const groups: Record<string, Record<string, string | null>[]> = {};

  // Find the t397 tab section that contains spec group names
  // The spec groups section has buttons with aria-controls pointing to t431 record IDs
  // It's the t397 section that's NOT an accordion (no uc-accord class)
  const tabNames: string[] = [];
  
  // Target the second t397 section (spec groups), not the first (colors)
  // The spec groups section has class "t-rec_pt_0" and no "uc-accord" class
  const specTabSection = $("[data-record-type='397']").filter((_, el) => {
    const $el = $(el);
    // The spec groups section doesn't have the accordion class
    return !$el.hasClass("uc-accord-a-1") && !$el.hasClass("uc-accord-a-2");
  }).first();

  if (specTabSection.length) {
    specTabSection.find(".t397__title").each((_, el) => {
      const name = $(el).text().trim();
      if (name && name.length < 100) {
        tabNames.push(name);
      }
    });
  }

  // Fallback: try to find tab names from select options
  if (tabNames.length === 0) {
    $("[data-record-type='397']").each((_, section) => {
      $(section).find(".t397__select option").each((_, el) => {
        const name = $(el).text().trim();
        if (name && name.length < 100 && !tabNames.includes(name)) {
          tabNames.push(name);
        }
      });
    });
  }

  // Each t431 section corresponds to a tab
  const tables = $(".t431");
  tables.each((tableIndex, tableEl) => {
    const $table = $(tableEl);
    const groupName = tabNames[tableIndex] || `Группа ${tableIndex + 1}`;

    const part1 = $table.find(".t431__data-part1").text().trim();
    const part2 = $table.find(".t431__data-part2").text().trim();

    if (!part1 && !part2) return;

    // Parse header (trim names)
    const headerParts = part1.split(";").map((s) => s.trim()).filter(Boolean);
    const trimNames = headerParts.slice(1); // skip "Комплектация"

    // Parse data rows
    const rows: Record<string, string | null>[] = [];
    const dataLines = part2.split("\n").map((l) => l.trim()).filter(Boolean);

    for (const line of dataLines) {
      const parts = line.split(";").map((s) => s.trim());
      if (parts.length < 2) continue;

      const specName = parts[0];
      if (!specName) continue;

      const row: Record<string, string | null> = { __specName: specName };

      for (let i = 0; i < trimNames.length; i++) {
        const value = parts[i + 1]?.trim() || null;
        row[trimNames[i]] = value;
        row[`col_${i}`] = value;
      }

      rows.push(row);
    }

    if (rows.length > 0) {
      groups[groupName] = rows;
    }
  });

  return Object.keys(groups).length > 0 ? groups : null;
}

// ─── Generic parsing (original) ────────────────────────────────────────

function extractVehicleData(html: string, url: string): RawVehicleData | null {
  const $ = cheerio.load(html);
  const title = $("title").text().trim() || $("h1").first().text().trim();

  const brand = extractBrand($, title);
  const model = extractModel($, title);

  if (!brand || !model) {
    console.log(`  ⚠ Could not determine brand/model from: ${title}`);
    return null;
  }

  const trims = extractTrims($, url);

  return {
    sourceUrl: url,
    sourceSite: new URL(url).hostname,
    title,
    brand,
    model,
    trims,
    scrapedAt: new Date().toISOString(),
  };
}

function extractBrand($: cheerio.CheerioAPI, title: string): string | null {
  const knownBrands = [
    "Zeekr", "BYD", "Changan", "Geely", "Chery", "Haval", "MG",
    "BMW", "Mercedes", "Audi", "Toyota", "Hyundai", "Kia",
    "Tesla", "Nio", "Xpeng", "Li Auto", "Deepal", "Avatr",
    "Lynk", "Proton", "Jetour", "Omoda", "Jaecoo", "Voyah",
  ];

  for (const brand of knownBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  const h1 = $("h1").first().text();
  for (const brand of knownBrands) {
    if (h1.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  const metaContent = $('meta[name="description"]').attr("content") || "";
  for (const brand of knownBrands) {
    if (metaContent.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}

function extractModel($: cheerio.CheerioAPI, title: string): string | null {
  const h1 = $("h1").first().text().trim();
  const text = h1 || title;

  const cleaned = text
    .replace(/(?:купить|цена|в наличии|в ташкенте|в узбекистане|доставка|официальный|дилер|авто|автомобиль)/gi, "")
    .trim();

  const modelMatch = cleaned.match(/^[\w\s]+?\s+((?:[\w]+\s*)+(?:\d{4})?)/i);
  if (modelMatch) {
    return modelMatch[1].trim();
  }

  const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
  if (words.length >= 2) {
    return words.slice(0, 3).join(" ");
  }

  return null;
}

function extractTrims($: cheerio.CheerioAPI, url: string): RawTrim[] {
  const trims: RawTrim[] = [];

  $("table").each((_, table) => {
    const rows = $(table).find("tr");
    rows.each((_, row) => {
      const cells = $(row).find("td, th");
      if (cells.length >= 2) {
        const name = $(cells[0]).text().trim();
        if (name && name.length < 100) {
          const specs = extractSpecsFromRow($, row);
          const price = specs["price"] || null;
          trims.push(createTrimFromSpecs(name, price, specs, url));
        }
      }
    });
  });

  if (trims.length === 0) {
    $('[class*="trim"], [class*="variant"], [class*="configuration"], [class*="card"]').each((_, el) => {
      const name = $(el).find("h2, h3, h4, [class*='title'], [class*='name']").first().text().trim();
      if (name && name.length < 100) {
        const specs = extractSpecsFromSection($, el);
        const price = specs["price"] || null;
        trims.push(createTrimFromSpecs(name, price, specs, url));
      }
    });
  }

  if (trims.length === 0) {
    const price = $('[class*="price"]').first().text().trim();
    const specs = extractSpecsFromSection($, $("body").get(0));
    trims.push(createTrimFromSpecs("Base", price, specs, url));
  }

  return trims;
}

function extractSpecsFromRow($: cheerio.CheerioAPI, row: any): Record<string, string> {
  const specs: Record<string, string> = {};
  $(row).find("td").each((i, cell) => {
    const text = $(cell).text().trim();
    if (text) {
      specs[`col_${i}`] = text;
    }
  });
  return specs;
}

function extractSpecsFromSection($: cheerio.CheerioAPI, section: any): Record<string, string> {
  const specs: Record<string, string> = {};

  $(section).find("dt, th, [class*='label'], [class*='key']").each((_, key) => {
    const k = $(key).text().trim();
    const v = $(key).next("dd, td, [class*='value']").text().trim();
    if (k && v) {
      specs[k] = v;
    }
  });

  $(section).find("li").each((_, li) => {
    const text = $(li).text().trim();
    const match = text.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      specs[match[1].trim()] = match[2].trim();
    }
  });

  const text = $(section).text();
  const patterns = [
    { regex: /(\d+[\.,]?\d*)\s*(?:кВт|kW)/i, key: "Мощность (кВт)" },
    { regex: /(\d+[\.,]?\d*)\s*(?:л\.?\s*с\.?|hp|л\.с\.)/i, key: "Мощность двигателя" },
    { regex: /(\d+[\.,]?\d*)\s*(?:кВт\s*ч|kWh)/i, key: "Ёмкость батареи" },
    { regex: /(\d+)\s*(?:км|km)\s*(?:запас|хода|range)?/i, key: "Запас хода" },
    { regex: /(\d+[\.,]?\d*)\s*сек/i, key: "Разгон 0-100" },
    { regex: /(\d+)\s*(?:мест|сидений|seats)/i, key: "Мест" },
  ];

  for (const { regex, key } of patterns) {
    const match = text.match(regex);
    if (match && !specs[key]) {
      specs[key] = match[0];
    }
  }

  return specs;
}

function createTrimFromSpecs(name: string, price: string | null, specs: Record<string, string>, url: string): RawTrim {
  const priceData = parsePrice(price);

  const imageUrls: string[] = [];

  return {
    name,
    price: priceData ? String(priceData.amount) : null,
    priceCurrency: priceData?.currency || "USD",
    priceBasis: priceData?.basis || "CIF",
    powertrainType: normalizePowertrain(findSpecValue(specs, ["powertrain", "powertrainType", "Тип двигателя", "Тип привода", "Двигатель"])),
    drivetrain: normalizeDrivetrain(findSpecValue(specs, ["drivetrain", "Привод", "Тип привода"])),
    motorPowerKw: parseNumber(findSpecValue(specs, ["Мощность (кВт)", "motorPowerKw", "Мощность двигателя (кВт)"])),
    enginePowerHp: parseNumber(findSpecValue(specs, ["Мощность двигателя", "enginePowerHp", "Мощность (л.с.)"])),
    engineDisplacementCc: parseNumber(findSpecValue(specs, ["Объём двигателя", "engineDisplacementCc", "Объём"])),
    batteryCapacityKwh: parseNumber(findSpecValue(specs, ["Ёмкость батареи", "batteryCapacityKwh", "Батарея"])),
    rangeKm: parseNumber(findSpecValue(specs, ["Запас хода", "range_km", "Дальность хода"])),
    acceleration0100: parseNumber(findSpecValue(specs, ["Разгон 0-100", "acceleration_0_100", "Разгон"])),
    bodyType: normalizeBodyType(findSpecValue(specs, ["bodyType", "Тип кузова", "Кузов"])),
    seats: parseNumber(findSpecValue(specs, ["Мест", "seats", "Количество мест"])) || 5,
    description: "",
    imageUrls,
    specs,
    rawSpecs: specs,
  };
}

function findSpecValue(specs: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    if (specs[key]) return specs[key];
    for (const specKey of Object.keys(specs)) {
      if (specKey.toLowerCase() === key.toLowerCase()) {
        return specs[specKey];
      }
    }
  }
  return null;
}

function saveRawData(data: RawVehicleData): void {
  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }
  const slug = generateSlug(`${data.brand}-${data.model}`);
  const filePath = path.join(RAW_DIR, `${slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  💾 Saved raw data: ${filePath}`);
}

async function main() {
  console.log("🔍 TerraAuto Vehicle Scraper\n");

  // Load URLs from both file and database
  const fileUrls = loadUrls();
  const dbUrls = await loadUrlsFromDb();
  const urls = [...new Set([...fileUrls, ...dbUrls])];

  console.log(`📋 Found ${urls.length} URLs to scrape (${fileUrls.length} from file, ${dbUrls.length} from DB)\n`);

  if (urls.length === 0) {
    console.log("No URLs found. Add URLs to data/urls.txt or use the CRM import page.");
    process.exit(0);
  }

  const results: RawVehicleData[] = [];
  const errors: string[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[${i + 1}/${urls.length}] ${url}`);

    const html = await fetchPage(url);
    if (!html) {
      errors.push(url);
      await updateUrlStatus(url, "error", "Failed to fetch");
      continue;
    }

    let data: RawVehicleData | null;

    if (isGonzoUrl(url)) {
      console.log("  → Detected gonzo-motors.uz, using specialized parser");
      data = extractGonzoVehicleData(html, url);
    } else {
      data = extractVehicleData(html, url);
    }

    if (data) {
      results.push(data);
      saveRawData(data);
      console.log(`  ✓ ${data.brand} ${data.model} (${data.trims.length} trims)`);
      await updateUrlStatus(url, "scraped");
    } else {
      errors.push(url);
      await updateUrlStatus(url, "error", "Could not extract vehicle data");
    }

    if (i < urls.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Scraping Summary");
  console.log("=".repeat(50));
  console.log(`Total URLs: ${urls.length}`);
  console.log(`Successful: ${results.length}`);
  console.log(`Failed: ${errors.length}`);

  if (results.length > 0) {
    console.log("\nVehicles scraped:");
    for (const r of results) {
      console.log(`  • ${r.brand} ${r.model} (${r.trims.length} trims)`);
    }
  }

  if (errors.length > 0) {
    console.log("\nFailed URLs:");
    for (const e of errors) {
      console.log(`  ❌ ${e}`);
    }
  }
}

main().catch(console.error);
