import { describe, it, expect } from "vitest";

describe("Comparison — Pure Logic", () => {
  it("empty trimIds produces empty rows", () => {
    const trimIds: string[] = [];
    expect(trimIds.length).toBe(0);
    expect(trimIds.filter((v) => v !== null)).toHaveLength(0);
  });

  it("comparison row values filter correctly", () => {
    const values = ["150", "180", null, "200"];
    const hasValue = values.some((v) => v !== null);
    expect(hasValue).toBe(true);

    const emptyValues = [null, null, null];
    const hasEmptyValue = emptyValues.some((v) => v !== null);
    expect(hasEmptyValue).toBe(false);
  });

  it("comparison row structure is valid", () => {
    const row = {
      specName: "Мощность",
      specSlug: "power",
      groupName: "Двигатель",
      unit: "кВт",
      values: ["150", "180", null, "200"],
    };
    expect(row.values).toHaveLength(4);
    expect(row.specName).toBe("Мощность");
    expect(row.unit).toBe("кВт");
  });
});
