"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Gauge, BatteryCharging, Timer, Zap, Battery, Flame, Fuel } from "lucide-react";
import { formatUsd, powerLabel, powertrainLabel } from "@/lib/format";
import { PreserveScrollLink } from "@/components/preserve-scroll-link";

function powertrainIcon(type: string | null | undefined) {
  const cls = "size-3";
  switch (type) {
    case "bev":
      return <Zap className={cls} />;
    case "phev":
    case "hev":
      return <Battery className={cls} />;
    case "petrol":
      return <Flame className={cls} />;
    case "diesel":
      return <Fuel className={cls} />;
    case "reev":
      return <Zap className={cls} />;
    default:
      return null;
  }
}

interface Trim {
  id: string;
  name: string;
  slug: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  enginePowerHp: number | null;
  rangeKm: number | null;
  acceleration0100: string | number | null;
  basePrice: string | null;
}

export function TrimSelectorCards({
  trims,
  currentSlug,
}: {
  trims: Trim[];
  currentSlug: string;
}) {
  if (trims.length <= 1) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Комплектации</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trims.map((trim) => {
          const isCurrent = trim.slug === currentSlug;
          const power = powerLabel(trim.motorPowerKw, trim.enginePowerHp);
          const card = (
            <Card
              className={`group h-full transition duration-200 ${
                isCurrent
                  ? "bg-brand-muted/40 ring-2 ring-brand"
                  : "hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-brand/40"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{trim.name}</h3>
                  {isCurrent && (
                    <Badge className="shrink-0 gap-1 bg-brand text-brand-foreground">
                      <Check className="size-3" />
                      Текущая
                    </Badge>
                  )}
                </div>

                {(trim.powertrainType || trim.drivetrain) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trim.powertrainType && (
                      <Badge variant="secondary" className="gap-1">
                        {powertrainIcon(trim.powertrainType)}
                        {powertrainLabel(trim.powertrainType)}
                      </Badge>
                    )}
                    {trim.drivetrain && (
                      <Badge variant="outline">{trim.drivetrain}</Badge>
                    )}
                  </div>
                )}

                {(power || trim.rangeKm || trim.acceleration0100) && (
                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {power && (
                      <div className="flex items-center gap-2">
                        <Gauge className="size-3.5 text-brand" />
                        {power}
                      </div>
                    )}
                    {trim.rangeKm && (
                      <div className="flex items-center gap-2">
                        <BatteryCharging className="size-3.5 text-brand" />
                        {trim.rangeKm} км запас хода
                      </div>
                    )}
                    {trim.acceleration0100 && (
                      <div className="flex items-center gap-2">
                        <Timer className="size-3.5 text-brand" />
                        0-100: {trim.acceleration0100} сек
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-muted px-3 py-2.5">
                  <div>
                    <p className="text-xs text-brand-muted-foreground">от</p>
                    <p className="mt-0.5 text-lg font-bold tracking-[-0.02em] tabular-nums">
                      {formatUsd(trim.basePrice)}
                    </p>
                  </div>
                  {!isCurrent && (
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                      Выбрать
                      <ArrowRight className="size-4" />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          return isCurrent ? (
            <div key={trim.id}>{card}</div>
          ) : (
            <PreserveScrollLink
              key={trim.id}
              href={`/cars/${trim.slug}`}
              className="block h-full"
            >
              {card}
            </PreserveScrollLink>
          );
        })}
      </div>
    </section>
  );
}
