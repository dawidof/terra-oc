import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusStyle {
  /** Singular label, used on badges. */
  label: string;
  /** Plural label, used for kanban columns and grouped lists. */
  plural: string;
  /** Badge surface classes. */
  badge: string;
  /** Small colour indicator, used in kanban headers and legends. */
  dot: string;
  /** Resolved CSS colour for charts (recharts needs a paint value). */
  chart: string;
}

/**
 * Single source of truth for lead status presentation. Previously duplicated
 * across status-badge, kanban-board, kanban-column and conversion-funnel.
 */
export const statusStyles: Record<string, StatusStyle> = {
  new: {
    label: "Новая",
    plural: "Новые",
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
    dot: "bg-blue-500",
    chart: "var(--chart-3)",
  },
  assigned: {
    label: "Назначена",
    plural: "Назначены",
    badge: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
    dot: "bg-muted-foreground/50",
    chart: "var(--chart-2)",
  },
  contacted: {
    label: "Связались",
    plural: "Связались",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dot: "bg-amber-400",
    chart: "var(--chart-4)",
  },
  needs_follow_up: {
    label: "Требует звонка",
    plural: "Требуют звонка",
    badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    dot: "bg-orange-500",
    chart: "#f97316",
  },
  qualified: {
    label: "Квалифицирована",
    plural: "Квалифицированы",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
    dot: "bg-violet-500",
    chart: "#8b5cf6",
  },
  quote_sent: {
    label: "Предложение",
    plural: "Предложения",
    badge: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20",
    dot: "bg-indigo-500",
    chart: "#6366f1",
  },
  negotiation: {
    label: "Переговоры",
    plural: "Переговоры",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    dot: "bg-sky-500",
    chart: "#0ea5e9",
  },
  won: {
    label: "Продажа",
    plural: "Продажи",
    badge: "bg-brand-muted text-brand-muted-foreground ring-1 ring-brand/25",
    dot: "bg-brand",
    chart: "var(--brand)",
  },
  lost: {
    label: "Отказ",
    plural: "Отказы",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    dot: "bg-red-500",
    chart: "#ef4444",
  },
};

export const STATUS_ORDER = Object.keys(statusStyles);

const fallbackStyle: StatusStyle = {
  label: "",
  plural: "",
  badge: "bg-muted text-muted-foreground ring-1 ring-foreground/10",
  dot: "bg-muted-foreground/50",
  chart: "var(--chart-2)",
};

export function getStatusStyle(status: string): StatusStyle {
  const style = statusStyles[status];
  if (!style) return { ...fallbackStyle, label: status, plural: status };
  return style;
}

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const style = getStatusStyle(status);
  return (
    <Badge variant="secondary" className={cn(style.badge, className)}>
      {style.label}
    </Badge>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn("size-2.5 shrink-0 rounded-full", getStatusStyle(status).dot, className)}
      aria-hidden
    />
  );
}

export function getStatusLabel(status: string): string {
  return getStatusStyle(status).label;
}

export function getStatusOptions() {
  return STATUS_ORDER.map((value) => ({
    value,
    label: statusStyles[value].label,
  }));
}

export function statusChartColor(status: string): string {
  return getStatusStyle(status).chart;
}
