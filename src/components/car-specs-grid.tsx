interface SpecItem {
  label: string;
  value: string | null | undefined;
}

interface CarSpecsGridProps {
  brandName: string;
  modelName: string;
  trimName: string;
  modelVersionName?: string;
  modelYearFrom?: number | null;
  modelYearTo?: number | null;
  sourceCountry?: string | null;
  mileageKm?: number | null;
  powertrainType?: string | null;
  engineDisplacementCc?: number | null;
  drivetrain?: string | null;
  seats?: number | null;
}

function powertrainLabel(type: string | null | undefined): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "hev": return "Гибрид";
    case "reev": return "REEV";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    default: return type || "";
  }
}

function formatDisplacement(cc: number | null | undefined): string {
  if (!cc) return "";
  const liters = cc / 1000;
  return `${liters.toFixed(2)} л.`;
}

function generationLabel(
  name: string | undefined,
  yearFrom: number | null | undefined,
  yearTo: number | null | undefined
): string {
  if (!name) return "";
  const currentYear = new Date().getFullYear();
  const years =
    yearFrom && yearTo
      ? ` (${yearFrom} – ${yearTo === currentYear ? "н.в." : yearTo})`
      : yearFrom
        ? ` (${yearFrom} – н.в.)`
        : "";
  return `${name}${years}`;
}

export function CarSpecsGrid({
  brandName,
  modelName,
  trimName,
  modelVersionName,
  modelYearFrom,
  modelYearTo,
  sourceCountry,
  mileageKm,
  powertrainType,
  engineDisplacementCc,
  drivetrain,
  seats,
}: CarSpecsGridProps) {
  const specs: SpecItem[] = [
    { label: "Модель", value: `${brandName} ${modelName}` },
    {
      label: "Поколение",
      value: generationLabel(modelVersionName, modelYearFrom, modelYearTo),
    },
    { label: "Комплектация", value: trimName },
    {
      label: "Год",
      value: modelYearFrom ? String(modelYearFrom) : null,
    },
    { label: "Страна", value: sourceCountry },
    {
      label: "Пробег",
      value:
        mileageKm != null
          ? `${mileageKm.toLocaleString("ru-RU")} км`
          : null,
    },
    { label: "Тип двигателя", value: powertrainLabel(powertrainType) },
    { label: "Объём", value: formatDisplacement(engineDisplacementCc) },
    { label: "Привод", value: drivetrain },
    { label: "Мест", value: seats ? String(seats) : null },
  ].filter((s) => s.value);

  if (specs.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Характеристики</h3>
      <div className="divide-y rounded-lg border">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex items-center justify-between px-4 py-2.5 text-sm"
          >
            <span className="text-muted-foreground">{spec.label}</span>
            <span className="font-medium">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
