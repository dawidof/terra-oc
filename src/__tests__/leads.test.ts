import { describe, it, expect } from "vitest";
import { leadSchema } from "@/lib/validation-schemas";

describe("Lead Validation", () => {
  it("accepts complete lead with configuration", () => {
    const result = leadSchema.safeParse({
      name: "Алимов",
      phone: "+998901234567",
      trimId: "550e8400-e29b-41d4-a716-446655440000",
      brandName: "Toyota",
      modelName: "Camry",
      trimName: "Luxury",
      estimatedTotal: 45000,
      configurationJson: {
        exterior_color: "Белый",
        interior_color: "Кожа",
        options: ["Кожаный салон", "Камера"],
        totalDelta: 2500,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts lead with all optional fields", () => {
    const result = leadSchema.safeParse({
      name: "Тест",
      phone: "+998901234567",
      telegram: "@test",
      whatsapp: "+998901234567",
      email: "test@test.uz",
      preferredContactMethod: "whatsapp",
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "spring_sale",
      referrer: "https://google.com",
      comment: "Нужна консультация",
      logisticsCost: 3000,
      customsCost: 5000,
      serviceFee: 1000,
      deliveryDays: 25,
      sourcePrice: 35000,
      currency: "USD",
      source: "calculator",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = leadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone", () => {
    const result = leadSchema.safeParse({ name: "Test", phone: "123" });
    expect(result.success).toBe(false);
  });

  it("accepts valid phone with + prefix", () => {
    const result = leadSchema.safeParse({ name: "Test", phone: "+998901234567" });
    expect(result.success).toBe(true);
  });
});
