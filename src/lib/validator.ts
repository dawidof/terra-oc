import type { RawVehicleData, RawTrim } from "./normalizer";

export interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
  trimName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
}

export function validateVehicle(data: RawVehicleData): ValidationResult {
  const issues: ValidationIssue[] = [];

  // ─── Brand/Model level checks ────────────────────────────────────────
  if (!data.brand || data.brand.trim() === "") {
    issues.push({ severity: "error", field: "brand", message: "Марка не определена" });
  }
  if (!data.model || data.model.trim() === "") {
    issues.push({ severity: "error", field: "model", message: "Модель не определена" });
  }
  if (!data.title || data.title.trim() === "") {
    issues.push({ severity: "warning", field: "title", message: "Пустой заголовок страницы" });
  }

  // ─── Trim level checks ──────────────────────────────────────────────
  if (data.trims.length === 0) {
    issues.push({ severity: "error", field: "trims", message: "Не найдены комплектации" });
  }

  const trimNames = data.trims.map((t) => t.name);
  const uniqueTrims = new Set(trimNames);
  if (trimNames.length !== uniqueTrims.size) {
    issues.push({ severity: "error", field: "trims", message: "Дублирующиеся комплектации" });
  }

  for (const trim of data.trims) {
    const prefix = trim.name ? `[${trim.name}]` : "[Без названия]";

    // Price checks
    if (!trim.price || trim.price === "0") {
      issues.push({ severity: "warning", field: "price", message: `${prefix} Цена не указана`, trimName: trim.name });
    }

    // Powertrain consistency
    if (trim.powertrainType === "bev" || trim.powertrainType === "phev") {
      if (!trim.batteryCapacityKwh) {
        issues.push({ severity: "warning", field: "battery", message: `${prefix} Нет ёмкости батареи для электромобиля`, trimName: trim.name });
      }
      if (!trim.rangeKm) {
        issues.push({ severity: "warning", field: "range", message: `${prefix} Нет запаса хода`, trimName: trim.name });
      }
    }

    // Range without standard
    if (trim.rangeKm && trim.rangeKm > 0) {
      const rangeSpec = trim.specs["range_km"];
      if (rangeSpec && !rangeSpec.toLowerCase().includes("cltc") && !rangeSpec.toLowerCase().includes("wltp") && !rangeSpec.toLowerCase().includes("nedc") && !rangeSpec.toLowerCase().includes("epa")) {
        issues.push({ severity: "warning", field: "range_standard", message: `${prefix} Запас хода без указания стандарта (CLTC/WLTP/NEDC/EPA)`, trimName: trim.name });
      }
    }

    // Impossible values
    if (trim.rangeKm && trim.rangeKm > 1000) {
      issues.push({ severity: "warning", field: "range", message: `${prefix} Подозрительно большой запас хода: ${trim.rangeKm} км`, trimName: trim.name });
    }
    if (trim.acceleration0100 && trim.acceleration0100 < 1.5) {
      issues.push({ severity: "warning", field: "acceleration", message: `${prefix} Подозрительно быстрый разгон: ${trim.acceleration0100} сек`, trimName: trim.name });
    }
    if (trim.acceleration0100 && trim.acceleration0100 > 20) {
      issues.push({ severity: "warning", field: "acceleration", message: `${prefix} Подозрительно медленный разгон: ${trim.acceleration0100} сек`, trimName: trim.name });
    }

    // Missing body type
    if (!trim.bodyType) {
      issues.push({ severity: "warning", field: "bodyType", message: `${prefix} Тип кузова не определён`, trimName: trim.name });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    isValid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
  };
}

export function validateAll(vehicles: RawVehicleData[]): {
  results: { vehicle: RawVehicleData; validation: ValidationResult }[];
  totalErrors: number;
  totalWarnings: number;
} {
  const results = vehicles.map((v) => ({
    vehicle: v,
    validation: validateVehicle(v),
  }));

  const totalErrors = results.reduce((sum, r) => sum + r.validation.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.validation.warningCount, 0);

  return { results, totalErrors, totalWarnings };
}
