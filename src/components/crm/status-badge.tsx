import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  new: { label: "Новая", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  assigned: { label: "Назначена", className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  contacted: { label: "Связались", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  needs_follow_up: { label: "Требует звонка", className: "bg-amber-100 text-amber-800 hover:bg-amber-100" },
  qualified: { label: "Квалифицирована", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  quote_sent: { label: "Предложение", className: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100" },
  negotiation: { label: "Переговоры", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  won: { label: "Продажа", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  lost: { label: "Отказ", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "" };
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

export function getStatusLabel(status: string): string {
  return statusConfig[status]?.label || status;
}

export function getStatusOptions() {
  return Object.entries(statusConfig).map(([value, { label }]) => ({
    value,
    label,
  }));
}
