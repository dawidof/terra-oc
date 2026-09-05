import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Car, Zap, Gauge, MapPin, ArrowRight } from "lucide-react";

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

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-emerald-600";
  if (score >= 40) return "text-yellow-600";
  return "text-orange-600";
}

export function ResultCard({
  rec,
  onLeadForm,
  selected = false,
  onToggleSelect,
}: {
  rec: Recommendation;
  onLeadForm: () => void;
  selected?: boolean;
  onToggleSelect?: (trimSlug: string) => void;
}) {
  return (
    <Card className={`overflow-hidden transition-all ${selected ? "ring-2 ring-emerald-600" : ""}`}>
      <CardContent className="p-6">
        <div className="flex gap-5">
          {/* Selection checkbox */}
          <div className="flex flex-col items-center gap-2">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(rec.trimSlug)}
              aria-label={`Выбрать ${rec.brandName} ${rec.modelName}`}
            />
            {/* Car image */}
            {rec.imageUrl && (
              <div className="relative h-40 w-56 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={rec.imageUrl}
                  alt={`${rec.brandName} ${rec.modelName}`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">
                    {rec.brandName} {rec.modelName}
                  </h3>
                  <Badge variant="outline">{rec.trimName}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {rec.bodyType || "—"} · {powertrainLabel(rec.powertrainType)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${scoreColor(rec.score)}`}>
                  {rec.score}%
                </p>
                <p className="text-xs text-muted-foreground">совпадение</p>
              </div>
            </div>

            {/* Reasons */}
            <div className="mt-4 space-y-1">
              {rec.reasons.map((reason, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {reason}
                </div>
              ))}
            </div>

            {/* Specs */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {rec.rangeKm && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {rec.rangeKm} км
                </span>
              )}
              {rec.acceleration0100 && (
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {rec.acceleration0100} сек
                </span>
              )}
            </div>

            {/* Price + Actions */}
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-xl font-bold text-emerald-600">
                {formatPrice(rec.estimatedTotalUsd)}
              </p>
              <div className="flex gap-2">
                <Link href={`/cars/${rec.trimSlug}`}>
                  <Button variant="ghost" size="sm">
                    Подробнее
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
