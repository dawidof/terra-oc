/** Display formatters and labels shared by the public site and the CRM. */

export function powertrainLabel(type: string | null | undefined): string {
  switch (type) {
    case "bev":
      return "Электро";
    case "phev":
    case "hev":
      return "Гибрид";
    case "reev":
      return "REEV";
    case "petrol":
      return "Бензин";
    case "diesel":
      return "Дизель";
    default:
      return type || "";
  }
}

export function powerLabel(
  kw: number | null | undefined,
  hp?: number | null
): string {
  if (kw) return `${kw} кВт`;
  if (hp) return `${hp} л.с.`;
  return "";
}

export function formatUsd(price: string | number | null | undefined): string {
  if (price === null || price === undefined || price === "") {
    return "Цена уточняется";
  }
  const num = typeof price === "number" ? price : Number(price);
  if (!Number.isFinite(num) || num === 0) return "Цена уточняется";
  return `$${num.toLocaleString("en-US")}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("ru-RU");
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU");
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин`;
  if (diffHours < 24) return `${diffHours} ч`;
  if (diffDays < 30) return `${diffDays} д`;
  return formatDate(date);
}

export function toDateInputValue(value: string | Date | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}
