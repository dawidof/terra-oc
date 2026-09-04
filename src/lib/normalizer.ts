export interface RawVehicleData {
  sourceUrl: string;
  sourceSite: string;
  title: string;
  brand: string;
  model: string;
  trims: RawTrim[];
  scrapedAt: string;
}

export interface RawTrim {
  name: string;
  price: string | null;
  priceCurrency: string;
  priceBasis: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  enginePowerHp: number | null;
  engineDisplacementCc: number | null;
  batteryCapacityKwh: number | null;
  rangeKm: number | null;
  acceleration0100: number | null;
  bodyType: string | null;
  seats: number | null;
  description: string;
  imageUrls: string[];
  specs: Record<string, string>;
  rawSpecs: Record<string, string>;
}

const DRIVETRAIN_ALIASES: Record<string, string> = {
  "полноприводный": "AWD",
  "полный": "AWD",
  "awd": "AWD",
  "4wd": "AWD",
  "4x4": "AWD",
  "передний": "FWD",
  "переднеприводный": "FWD",
  "fwd": "FWD",
  "задний": "RWD",
  "заднеприводный": "RWD",
  "rwd": "RWD",
};

const POWERTRAIN_ALIASES: Record<string, string> = {
  "электро": "bev",
  "электрический": "bev",
  "электромобиль": "bev",
  "bev": "bev",
  "ev": "bev",
  "гибрид": "phev",
  "гибридный": "phev",
  "phev": "phev",
  "hybrid": "phev",
  "подключаемый гибрид": "phev",
  "plug-in": "phev",
  "бензин": "petrol",
  "бензиновый": "petrol",
  "petrol": "petrol",
  "gasoline": "petrol",
  "дизель": "diesel",
  "дизельный": "diesel",
  "diesel": "diesel",
};

const BODY_TYPE_ALIASES: Record<string, string> = {
  "кроссовер": "SUV",
  "внедорожник": "SUV",
  "suv": "SUV",
  "crossover": "SUV",
  "седан": "sedan",
  "sedan": "sedan",
  "хэтчбек": "hatchback",
  "hatchback": "hatchback",
  "лифтбек": "liftback",
  "liftback": "liftback",
  "универсал": "wagon",
  "wagon": "wagon",
  "минивэн": "minivan",
  "minivan": "minivan",
  "пикап": "pickup",
  "pickup": "pickup",
  "купе": "coupe",
  "coupe": "coupe",
};

const SPEC_ALIASES: Record<string, string> = {
  "запас хода": "range_km",
  "запас хода (cltc)": "range_km",
  "запас хода (wltp)": "range_km",
  "дальность хода": "range_km",
  "дальность": "range_km",
  "range": "range_km",
  "range (cltc)": "range_km",
  "range (wltp)": "range_km",
  "ёмкость батареи": "battery_capacity_kwh",
  "батарея": "battery_capacity_kwh",
  "battery": "battery_capacity_kwh",
  "battery capacity": "battery_capacity_kwh",
  "мощность двигателя": "engine_power_hp",
  "мощность": "engine_power_hp",
  "power": "engine_power_hp",
  "engine power": "engine_power_hp",
  "мощность двигателя (квт)": "motor_power_kw",
  "мощность (квт)": "motor_power_kw",
  "motor power": "motor_power_kw",
  "разгон 0-100": "acceleration_0_100",
  "разгон": "acceleration_0_100",
  "acceleration": "acceleration_0_100",
  "0-100": "acceleration_0_100",
  "объём двигателя": "engine_displacement_cc",
  "объём": "engine_displacement_cc",
  "displacement": "engine_displacement_cc",
  "engine displacement": "engine_displacement_cc",
  "колёсная база": "wheelbase_mm",
  "колесная база": "wheelbase_mm",
  "wheelbase": "wheelbase_mm",
  "длина": "length_mm",
  "length": "length_mm",
  "ширина": "width_mm",
  "width": "width_mm",
  "высота": "height_mm",
  "height": "height_mm",
  "клиренс": "ground_clearance_mm",
  "дорожный просвет": "ground_clearance_mm",
  "ground clearance": "ground_clearance_mm",
  "мест": "seats",
  "количество мест": "seats",
  "seats": "seats",
  "масса": "curb_weight_kg",
  "снаряжённая масса": "curb_weight_kg",
  "curb weight": "curb_weight_kg",
};

export function normalizeDrivetrain(raw: string | null): string | null {
  if (!raw) return null;
  return DRIVETRAIN_ALIASES[raw.toLowerCase().trim()] || null;
}

export function normalizePowertrain(raw: string | null): string | null {
  if (!raw) return null;
  return POWERTRAIN_ALIASES[raw.toLowerCase().trim()] || null;
}

export function normalizeBodyType(raw: string | null): string | null {
  if (!raw) return null;
  return BODY_TYPE_ALIASES[raw.toLowerCase().trim()] || null;
}

export function normalizeSpecKey(rawKey: string): string | null {
  return SPEC_ALIASES[rawKey.toLowerCase().trim()] || null;
}

export function parseNumber(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parsePrice(raw: string | null): { amount: number; currency: string; basis: string } | null {
  if (!raw) return null;

  let currency = "USD";
  let basis = "CIF";
  const lower = raw.toLowerCase();

  if (lower.includes("$") || lower.includes("usd") || lower.includes("доллар")) currency = "USD";
  if (lower.includes("₽") || lower.includes("rub") || lower.includes("руб")) currency = "RUB";
  if (lower.includes("сўм") || lower.includes("uzs") || lower.includes("сум")) currency = "UZS";
  if (lower.includes("cny") || lower.includes("юан")) currency = "CNY";

  if (lower.includes("cip") || lower.includes("cif")) basis = "CIF";
  if (lower.includes("fob")) basis = "FOB";
  if (lower.includes("exw") || lower.includes("завод")) basis = "EXW";
  if (lower.includes("аукцион") || lower.includes("auction")) basis = "auction";

  const numMatch = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  const amount = parseFloat(numMatch);
  if (isNaN(amount)) return null;

  return { amount, currency, basis };
}

export function normalizeSpecs(rawSpecs: Record<string, string>): Record<string, { value: string; rawLabel: string }> {
  const result: Record<string, { value: string; rawLabel: string }> = {};

  for (const [rawKey, rawValue] of Object.entries(rawSpecs)) {
    const normalizedKey = normalizeSpecKey(rawKey);
    if (normalizedKey && rawValue) {
      result[normalizedKey] = { value: rawValue, rawLabel: rawKey };
    }
  }

  return result;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
        ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
        н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
        ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
        ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[c] || c;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
