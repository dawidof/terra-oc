import Image from "next/image";
import Link from "next/link";
import { BatteryCharging, ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsd, powerLabel, powertrainLabel } from "@/lib/format";

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
  onExpand?: () => void;
  isExpanded?: boolean;
}

export function CarCard({
  brandName,
  modelName,
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
  onExpand,
  isExpanded,
}: CarCardProps) {
  const power = powerLabel(motorPowerKw, enginePowerHp);

  const inner = (
    <>
      <div className="relative aspect-[4/3] bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${brandName} ${modelName}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Фото скоро
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {powertrainType && (
            <Badge
              variant={powertrainType === "bev" ? "default" : "secondary"}
              className={
                powertrainType === "bev"
                  ? "bg-brand text-brand-foreground"
                  : undefined
              }
            >
              {powertrainLabel(powertrainType)}
            </Badge>
          )}
          {drivetrain && (
            <Badge variant="outline" className="bg-white/85 backdrop-blur-sm">
              {drivetrain}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4 sm:p-5">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {brandName}
          {modelYear ? ` · ${modelYear}` : ""}
        </p>
        <h3 className="mt-1.5 text-base leading-snug font-semibold tracking-tight">
          {modelName}{" "}
          <span className="font-normal text-muted-foreground">{trimName}</span>
        </h3>

        {(power || rangeKm) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {power && <span>{power}</span>}
            {rangeKm ? (
              <span className="inline-flex items-center gap-1">
                <BatteryCharging className="size-3.5" aria-hidden />
                {rangeKm} км
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-4 flex items-end justify-between rounded-lg bg-brand-muted px-3.5 py-3">
          <div>
            <p className="text-xs text-brand-muted-foreground">от</p>
            <p className="mt-0.5 text-lg font-bold tracking-[-0.02em] tabular-nums">
              {formatUsd(basePrice)}
            </p>
          </div>
          {estimatedTotalUsd && (
            <div className="text-right">
              <p className="text-xs text-brand-muted-foreground">под ключ</p>
              <p className="mt-0.5 text-base font-bold tabular-nums text-brand">
                {formatUsd(estimatedTotalUsd)}
              </p>
            </div>
          )}
        </div>

        {onExpand && (
          <div className="mt-3 flex justify-center">
            <ChevronDown
              className={`size-5 text-muted-foreground transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </CardContent>
    </>
  );

  const cardClass = [
    "group gap-0 overflow-hidden py-0 transition duration-200",
    "hover:-translate-y-1 hover:shadow-md hover:ring-2 hover:ring-brand/40",
    isExpanded ? "ring-2 ring-brand" : "",
  ].join(" ");

  if (onExpand) {
    return (
      <button type="button" onClick={onExpand} className="text-left">
        <Card className={cardClass}>{inner}</Card>
      </button>
    );
  }

  return (
    <Link href={`/cars/${trimSlug}`} className="block h-full">
      <Card className={cardClass}>{inner}</Card>
    </Link>
  );
}
