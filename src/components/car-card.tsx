import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CarCardProps {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  trimName: string;
  trimSlug: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  enginePowerHp: number | null;
  rangeKm: number | null;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
  modelYear: number | null;
}

function formatPrice(price: string | null): string {
  if (!price) return "Цена уточняется";
  const num = Number(price);
  return `$${num.toLocaleString("en-US")}`;
}

function powertrainLabel(type: string | null): string {
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

function powerLabel(kw: number | null, hp: number | null): string {
  if (kw) return `${kw} кВт`;
  if (hp) return `${hp} л.с.`;
  return "";
}

export function CarCard({
  brandName,
  brandSlug,
  modelName,
  modelSlug,
  trimName,
  trimSlug,
  powertrainType,
  drivetrain,
  motorPowerKw,
  enginePowerHp,
  rangeKm,
  basePrice,
  estimatedTotalUsd,
  imageUrl,
  modelYear,
}: CarCardProps) {
  return (
    <Link href={`/cars/${trimSlug}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`${brandName} ${modelName}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              Фото скоро
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1">
            {powertrainType && (
              <Badge variant={powertrainType === "bev" ? "default" : "secondary"}>
                {powertrainLabel(powertrainType)}
              </Badge>
            )}
            {drivetrain && (
              <Badge variant="outline" className="bg-white/90">
                {drivetrain}
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="mb-1 text-sm text-muted-foreground">
            {brandName} {modelYear && `• ${modelYear}`}
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            {modelName} <span className="text-muted-foreground font-normal">{trimName}</span>
          </h3>
          <div className="mb-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            {motorPowerKw && <span>{powerLabel(motorPowerKw, null)}</span>}
            {enginePowerHp && <span>{powerLabel(null, enginePowerHp)}</span>}
            {rangeKm && <span>🔋 {rangeKm} км</span>}
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground">от</div>
              <div className="text-xl font-bold">{formatPrice(basePrice)}</div>
            </div>
            {estimatedTotalUsd && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">под ключ</div>
                <div className="text-sm font-medium text-emerald-600">
                  {formatPrice(estimatedTotalUsd)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
