import { describe, it, expect } from "vitest";
import { leadSchema, selectorLeadSchema, calculateSchema } from "@/lib/validation-schemas";

describe("Lead Schema", () => {
  const validLead = {
    name: "Иван Петров",
    phone: "+998901234567",
  };

  it("accepts valid lead", () => {
    const result = leadSchema.safeParse(validLead);
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = leadSchema.safeParse({ ...validLead, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid phone", () => {
    const result = leadSchema.safeParse({ ...validLead, phone: "123" });
    expect(result.success).toBe(false);
  });

  it("accepts phone with + prefix", () => {
    const result = leadSchema.safeParse({ ...validLead, phone: "+998901234567" });
    expect(result.success).toBe(true);
  });

  it("rejects phone without country code", () => {
    const result = leadSchema.safeParse({ ...validLead, phone: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = leadSchema.safeParse({
      ...validLead,
      telegram: "@user",
      email: "test@example.com",
      preferredContactMethod: "telegram",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid preferred contact method", () => {
    const result = leadSchema.safeParse({
      ...validLead,
      preferredContactMethod: "email",
    });
    expect(result.success).toBe(false);
  });
});

describe("Selector Lead Schema", () => {
  it("accepts valid selector lead", () => {
    const result = selectorLeadSchema.safeParse({
      name: "Иван",
      phone: "+998901234567",
    });
    expect(result.success).toBe(true);
  });

  it("requires name", () => {
    const result = selectorLeadSchema.safeParse({
      phone: "+998901234567",
    });
    expect(result.success).toBe(false);
  });

  it("requires valid phone", () => {
    const result = selectorLeadSchema.safeParse({
      name: "Иван",
      phone: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("Calculate Schema", () => {
  const validCalc = {
    sourceCountry: "Китай",
    condition: "new" as const,
    purchasePrice: 30000,
    powertrain: "bev" as const,
  };

  it("accepts valid calculation input", () => {
    const result = calculateSchema.safeParse(validCalc);
    expect(result.success).toBe(true);
  });

  it("rejects negative price", () => {
    const result = calculateSchema.safeParse({ ...validCalc, purchasePrice: -100 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid condition", () => {
    const result = calculateSchema.safeParse({ ...validCalc, condition: "broken" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid powertrain", () => {
    const result = calculateSchema.safeParse({ ...validCalc, powertrain: "electric" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid powertrains", () => {
    const powertrains = ["bev", "phev", "petrol", "diesel", "hev", "reev"];
    for (const pt of powertrains) {
      const result = calculateSchema.safeParse({ ...validCalc, powertrain: pt });
      expect(result.success).toBe(true);
    }
  });
});
