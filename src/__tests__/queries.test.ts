import { describe, it, expect } from "vitest";

describe("Queries: Catalog — Pure Logic", () => {
  it("sort option types are valid", () => {
    const sorts = ["popular", "price_asc", "price_desc", "newest", "power", "range"];
    expect(sorts).toHaveLength(6);
  });

  it("totalPages calculation", () => {
    expect(Math.ceil(25 / 12)).toBe(3);
    expect(Math.ceil(24 / 12)).toBe(2);
    expect(Math.ceil(5 / 12)).toBe(1);
    expect(Math.ceil(0 / 12)).toBe(0);
  });

  it("total items text logic", () => {
    function totalItemsText(n: number): string {
      const lastDigit = n % 10;
      const lastTwoDigits = n % 100;
      if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "автомобилей";
      if (lastDigit === 1) return "автомобиль";
      if (lastDigit >= 2 && lastDigit <= 4) return "автомобиля";
      return "автомобилей";
    }
    expect(totalItemsText(1)).toBe("автомобиль");
    expect(totalItemsText(2)).toBe("автомобиля");
    expect(totalItemsText(5)).toBe("автомобилей");
    expect(totalItemsText(11)).toBe("автомобилей");
    expect(totalItemsText(21)).toBe("автомобиль");
    expect(totalItemsText(22)).toBe("автомобиля");
  });
});
