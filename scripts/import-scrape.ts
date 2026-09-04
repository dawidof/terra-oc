import * as fs from "fs";
import * as path from "path";
import * as cheerio from "cheerio";
import type { RawVehicleData, RawTrim } from "../src/lib/normalizer";
import { normalizeDrivetrain, normalizePowertrain, normalizeBodyType, parseNumber, parsePrice, generateSlug } from "../src/lib/normalizer";

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
    console.error(`❌ URL list not found: ${URLS_FILE}`);
    process.exit(1);
  }
  const content = fs.readFileSync(URLS_FILE, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
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

function extractVehicleData(html: string, url: string): RawVehicleData | null {
  const $ = cheerio.load(html);
  const title = $("title").text().trim() || $("h1").first().text().trim();

  // Try to extract brand and model from title or page content
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
  // Common brand names to look for
  const knownBrands = [
    "Zeekr", "BYD", "Changan", "Geely", "Chery", "Haval", "MG",
    "BMW", "Mercedes", "Audi", "Toyota", "Hyundai", "Kia",
    "Tesla", "Nio", "Xpeng", "Li Auto", "Deepal", "Avatr",
    "Lynk", "Proton", "Jetour", "Omoda", "Jaecoo",
  ];

  // Check title first
  for (const brand of knownBrands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  // Check h1
  const h1 = $("h1").first().text();
  for (const brand of knownBrands) {
    if (h1.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  // Check meta tags
  const metaContent = $('meta[name="description"]').attr("content") || "";
  for (const brand of knownBrands) {
    if (metaContent.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return null;
}

function extractModel($: cheerio.CheerioAPI, title: string): string | null {
  // Try to extract model from h1 or title
  const h1 = $("h1").first().text().trim();
  const text = h1 || title;

  // Remove brand name and common words to get model
  const cleaned = text
    .replace(/(?:купить|цена|в наличии|в ташкенте|в узбекистане|доставка|официальный|дилер|авто|автомобиль)/gi, "")
    .trim();

  // Try to find model pattern (Brand Model Year or Brand Model)
  const modelMatch = cleaned.match(/^[\w\s]+?\s+((?:[\w]+\s*)+(?:\d{4})?)/i);
  if (modelMatch) {
    return modelMatch[1].trim();
  }

  // Fallback: use the first few words after removing brand
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1);
  if (words.length >= 2) {
    return words.slice(0, 3).join(" ");
  }

  return null;
}

function extractTrims($: cheerio.CheerioAPI, url: string): RawTrim[] {
  const trims: RawTrim[] = [];

  // Look for trim/variant sections
  // Common patterns: tables with specs, accordion sections, card layouts

  // Pattern 1: Table rows with trim data
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

  // Pattern 2: Card-like sections
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

  // Pattern 3: Look for price and basic specs in the main content
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

  // Look for key-value pairs
  $(section).find("dt, th, [class*='label'], [class*='key']").each((_, key) => {
    const k = $(key).text().trim();
    const v = $(key).next("dd, td, [class*='value']").text().trim();
    if (k && v) {
      specs[k] = v;
    }
  });

  // Look for list items
  $(section).find("li").each((_, li) => {
    const text = $(li).text().trim();
    const match = text.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      specs[match[1].trim()] = match[2].trim();
    }
  });

  // Look for spec-like patterns in text
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

  // Extract image URLs
  const imageUrls: string[] = [];
  // This would be populated from the page's img tags

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
    // Case-insensitive search
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

  const urls = loadUrls();
  console.log(`📋 Found ${urls.length} URLs to scrape\n`);

  if (urls.length === 0) {
    console.log("No URLs found in data/urls.txt. Add some URLs and try again.");
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
      continue;
    }

    const data = extractVehicleData(html, url);
    if (data) {
      results.push(data);
      saveRawData(data);
      console.log(`  ✓ ${data.brand} ${data.model} (${data.trims.length} trims)`);
    } else {
      errors.push(url);
    }

    if (i < urls.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Summary
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
