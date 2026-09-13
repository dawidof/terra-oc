import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sourceStyles: Record<string, { label: string; className: string }> = {
  manager: { label: "Менеджер", className: "bg-muted text-muted-foreground" },
  configurator: {
    label: "Конфигуратор",
    className: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
  },
  calculator: {
    label: "Калькулятор",
    className: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  },
  phone: {
    label: "Телефон",
    className: "bg-brand-muted text-brand-muted-foreground ring-1 ring-brand/25",
  },
  telegram: {
    label: "Telegram",
    className: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
  },
  whatsapp: {
    label: "WhatsApp",
    className: "bg-brand-muted text-brand-muted-foreground ring-1 ring-brand/25",
  },
  selector: {
    label: "Селектор",
    className: "bg-muted text-muted-foreground",
  },
};

export function sourceLabel(source: string | null | undefined): string {
  if (!source) return "—";
  return sourceStyles[source]?.label ?? source;
}

export function sourceClassName(source: string | null | undefined): string {
  if (!source) return "bg-muted text-muted-foreground";
  return sourceStyles[source]?.className ?? "bg-muted text-muted-foreground";
}

export const SOURCE_OPTIONS = Object.entries(sourceStyles).map(
  ([value, { label }]) => ({ value, label })
);

export function SourceTag({
  source,
  className,
}: {
  source: string | null | undefined;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(sourceClassName(source), "font-normal", className)}
    >
      {sourceLabel(source)}
    </Badge>
  );
}
