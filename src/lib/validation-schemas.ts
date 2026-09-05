import { z } from "zod";

const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const leadSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(255),
  phone: z
    .string()
    .min(1, "Телефон обязателен")
    .regex(phoneRegex, "Некорректный номер телефона"),
  telegram: z.string().max(255).optional(),
  whatsapp: z.string().max(255).optional(),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  preferredContactMethod: z
    .enum(["phone", "telegram", "whatsapp"])
    .optional()
    .default("phone"),
  trimId: z.string().uuid().optional(),
  brandName: z.string().max(255).optional(),
  modelName: z.string().max(255).optional(),
  trimName: z.string().max(255).optional(),
  sourceCountry: z.string().max(100).optional(),
  condition: z.string().max(50).optional(),
  configurationJson: z
    .object({
      exterior_color: z.string().optional(),
      interior_color: z.string().optional(),
      wheels: z.string().optional(),
      options: z.array(z.string()).optional(),
      unpriced_options: z.array(z.string()).optional(),
      totalDelta: z.number().optional(),
    })
    .optional(),
  sourcePrice: z.number().positive().optional(),
  estimatedTotal: z.number().positive().optional(),
  currency: z.string().length(3).optional().default("USD"),
  source: z.string().max(100).optional(),
  utmSource: z.string().max(255).optional(),
  utmMedium: z.string().max(255).optional(),
  utmCampaign: z.string().max(255).optional(),
  referrer: z.string().optional(),
  comment: z.string().optional(),
  logisticsCost: z.number().optional(),
  customsCost: z.number().optional(),
  serviceFee: z.number().optional(),
  deliveryDays: z.number().int().optional(),
});

export const selectorLeadSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(255),
  phone: z
    .string()
    .min(1, "Телефон обязателен")
    .regex(phoneRegex, "Некорректный номер телефона"),
  telegram: z.string().max(255).optional(),
  preferredContactMethod: z
    .enum(["phone", "telegram", "whatsapp"])
    .optional()
    .default("phone"),
  comment: z.string().optional(),
});

export const calculateSchema = z.object({
  sourceCountry: z.string().min(1, "Страна обязательна"),
  condition: z.enum(["new", "used"]),
  purchasePrice: z.number().positive("Цена должна быть положительной"),
  currency: z.string().length(3).optional().default("USD"),
  powertrain: z.enum(["bev", "phev", "petrol", "diesel", "hev", "reev"]),
  engineDisplacementCc: z.number().int().positive().optional(),
  enginePowerHp: z.number().int().positive().optional(),
  motorPowerKw: z.number().positive().optional(),
  batteryCapacityKwh: z.number().positive().optional(),
  modelYear: z.number().int().min(1990).max(2030).optional(),
  trimId: z.string().uuid().optional(),
});

export const chooseSchema = z.object({
  budget: z.string().optional(),
  bodyType: z.string().optional(),
  powertrain: z.string().optional(),
  seats: z.string().optional(),
  priority: z.string().optional(),
  usage: z.string().optional(),
});

const leadStatusValues = [
  "new",
  "assigned",
  "contacted",
  "needs_follow_up",
  "qualified",
  "quote_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export const leadUpdateSchema = z.object({
  status: z.enum(leadStatusValues).optional(),
  assignedManagerId: z.string().uuid().nullable().optional(),
  nextFollowUpAt: z.string().datetime().nullable().optional(),
  estimatedTotal: z.number().positive().optional(),
  additionalCosts: z
    .array(
      z.object({
        label: z.string().min(1).max(255),
        amount: z.number(),
      })
    )
    .optional(),
  calculatorBreakdown: z
    .object({
      vehiclePrice: z.number(),
      logistics: z.number(),
      customsDuty: z.number(),
      exciseTax: z.number(),
      vat: z.number(),
      certificationFees: z.number(),
      serviceFee: z.number(),
      total: z.number(),
    })
    .optional(),
});

export const reviewUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  city: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  vehicleLabel: z.string().max(255).optional(),
  text: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
