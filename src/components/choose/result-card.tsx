import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitCompareArrows, Gauge, Route, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  trimId: string;
  trimName: string;
  modelName: string;
  brandName: string;
  trimSlug: string;
  bodyType: string | null;
  powertrainType: string | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  estimatedTotalUsd: string | null;
  score: number;
  reasons: string[];
  imageUrl: string | null;
}

function formatPrice(price: string | null): string {
  if (!price) return "Цена уточняется";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    default: return type || "";
  }
}

function scoreTone(score: number): string {
  if (score >= 80) return "bg-brand text-brand-foreground";
  if (score >= 60) return "bg-brand-muted text-brand-muted-foreground";
  return "bg-muted text-muted-foreground";
}

export function ResultCard({
  rec,
  selected = false,
  onToggleSelect,
}: {
  rec: Recommendation;
  selected?: boolean;
  onToggleSelect?: (trimSlug: string) => void;
}) {
  const compareChip = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleSelect?.(rec.trimSlug);
      }}
      aria-pressed={selected}
      aria-label={`Сравнить ${rec.brandName} ${rec.modelName}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-sm transition-all",
        selected
          ? "bg-brand text-brand-foreground"
          : "bg-background/90 text-foreground backdrop-blur hover:bg-background"
      )}
    >
      <GitCompareArrows className="h-3.5 w-3.5" />
      {selected ? "Выбрано" : "Сравнить"}
    </button>
  );

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden py-0 transition duration-200",
        selected ? "ring-2 ring-brand" : "hover:shadow-soft-lg"
      )}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {rec.imageUrl && (
            <div className="relative aspect-[16/10] w-full flex-shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:h-auto sm:w-64">
              <img
                src={rec.imageUrl}
                alt={`${rec.brandName} ${rec.modelName}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3">{compareChip}</div>
            </div>
          )}

          <div className="min-w-0 flex-1 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">
                    {rec.brandName} {rec.modelName}
                  </h3>
                  <Badge variant="outline">{rec.trimName}</Badge>
                  {!rec.imageUrl && compareChip}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rec.bodyType || "—"} · {powertrainLabel(rec.powertrainType)}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex flex-shrink-0 items-center rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap",
                  scoreTone(rec.score)
                )}
              >
                {rec.score}% совпадение
              </span>
            </div>

            {rec.reasons.length > 0 && (
              <div className="mt-4 space-y-1">
                {rec.reasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                    {reason}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {rec.rangeKm && (
                <span className="flex items-center gap-1">
                  <Route className="h-3.5 w-3.5" />
                  {rec.rangeKm} км
                </span>
              )}
              {rec.acceleration0100 && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3.5 w-3.5" />
                  {rec.acceleration0100} сек
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-xl font-bold text-brand">
                {formatPrice(rec.estimatedTotalUsd)}
              </p>
              <Link href={`/cars/${rec.trimSlug}`} className="flex-shrink-0">
                <Button variant="outline" size="sm">
                  Подробнее
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
