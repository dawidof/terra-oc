export const SELECTOR_ANSWER_LABELS: Record<string, Record<string, string>> = {
  budget: {
    under_35k: "До $35 000",
    "35k_45k": "$35 000 – $45 000",
    "45k_55k": "$45 000 – $55 000",
    over_55k: "Свыше $55 000",
    any: "Любой бюджет",
  },
  bodyType: {
    sedan: "Седан",
    suv: "Кроссовер / SUV",
    liftback: "Лифтбек",
    any: "Любой тип",
  },
  powertrain: {
    bev: "Электро (BEV)",
    phev: "Гибрид (PHEV)",
    any: "Любой тип привода",
  },
  seats: {
    "5": "5 мест",
    "7": "7 мест",
    any: "Любое кол-во мест",
  },
  priority: {
    price: "Цена",
    range: "Запас хода",
    performance: "Динамика",
    any: "Всё одинаково",
  },
  usage: {
    city: "В городе",
    family: "Для семьи",
    long_distance: "Длинные поездки",
    business: "Для бизнеса",
  },
};

export const SELECTOR_ANSWER_TITLES: Record<string, string> = {
  budget: "Бюджет",
  bodyType: "Кузов",
  powertrain: "Привод",
  seats: "Места",
  priority: "Приоритет",
  usage: "Использование",
};

export interface ParsedRecommendation {
  text: string;
  score: number;
  trimId?: string;
  reasons?: string[];
}

export interface SelectorContact {
  preferredContactMethod?: string;
  telegram?: string;
  comment?: string;
}

export interface SelectorMetadata {
  answers: Record<string, string>;
  fallbacks: Record<string, string>;
  recommendations: ParsedRecommendation[];
  contact: SelectorContact;
}

export interface ParsedSelectorComment {
  answers: Record<string, string>;
  fallbacks: Record<string, string>;
  recommendations: ParsedRecommendation[];
  contact: SelectorContact;
  hasMetadata: boolean;
}

const ANSWER_KEYS = ["budget", "bodyType", "powertrain", "seats", "priority", "usage"];

const CONTACT_LABELS: Record<string, string> = {
  phone: "Телефон",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
};

export function parseSelectorComment(comment: string): ParsedSelectorComment | null {
  const trimmed = comment.trim();
  if (!trimmed.startsWith("Подбор автомобиля")) return null;

  const metadata = extractMetadata(trimmed);
  if (metadata) {
    return {
      answers: metadata.answers,
      fallbacks: metadata.fallbacks,
      recommendations: metadata.recommendations,
      contact: metadata.contact,
      hasMetadata: true,
    };
  }

  return parseLegacyComment(trimmed);
}

function extractMetadata(comment: string): SelectorMetadata | null {
  const match = comment.match(/<!--SELECTOR_DATA:([\s\S]+?)-->/);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    const answers: Record<string, string> = {};
    const fallbacks: Record<string, string> = {};

    if (data.answers) {
      for (const key of ANSWER_KEYS) {
        if (data.answers[key] && data.answers[key] !== "—" && data.answers[key] !== "any") {
          answers[key] = data.answers[key];
        }
        const fallbackKey = `${key}Fallback`;
        if (data.answers[fallbackKey] && data.answers[fallbackKey] !== "—" && data.answers[fallbackKey] !== "any") {
          fallbacks[key] = data.answers[fallbackKey];
        }
      }
    }

    const recommendations: ParsedRecommendation[] = (data.recommendations || []).map((r: any) => ({
      text: r.text || "",
      score: r.score || 0,
      trimId: r.trimId,
      reasons: r.reasons || [],
    }));

    const contact: SelectorContact = {
      preferredContactMethod: data.contact?.preferredContactMethod,
      telegram: data.contact?.telegram,
      comment: data.contact?.comment,
    };

    return { answers, fallbacks, recommendations, contact };
  } catch {
    return null;
  }
}

function parseLegacyComment(comment: string): ParsedSelectorComment {
  const body = comment.replace(/^Подбор автомобиля\.?\s*/, "");
  const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

  const answers: Record<string, string> = {};
  let recommendationsRaw = "";

  for (const line of lines) {
    const recMatch = line.match(/^Рекомендации:\s*(.+)$/i);
    if (recMatch) {
      recommendationsRaw = recMatch[1];
      continue;
    }

    for (const key of ANSWER_KEYS) {
      const title = SELECTOR_ANSWER_TITLES[key];
      if (line.startsWith(`${title}:`)) {
        const value = line.slice(title.length + 1).trim();
        if (value && value !== "—") {
          answers[key] = value;
        }
        break;
      }
    }
  }

  const recommendations: ParsedRecommendation[] = [];
  if (recommendationsRaw) {
    const parts = recommendationsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    for (const part of parts) {
      const scoreMatch = part.match(/^(.+?)\s*\((\d+)%\)$/);
      if (scoreMatch) {
        recommendations.push({
          text: scoreMatch[1].trim(),
          score: parseInt(scoreMatch[2], 10),
        });
      } else {
        recommendations.push({ text: part, score: 0 });
      }
    }
  }

  return {
    answers,
    fallbacks: {},
    recommendations,
    contact: {},
    hasMetadata: false,
  };
}

export function translateAnswer(key: string, value: string): string {
  const labels = SELECTOR_ANSWER_LABELS[key];
  if (!labels) return value;
  return labels[value] || value;
}

export function contactMethodLabel(method: string): string {
  return CONTACT_LABELS[method] || method;
}
