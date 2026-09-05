"use client";

import { useState } from "react";
import Link from "next/link";
import { CarCard } from "@/components/car-card";
import { Configurator } from "@/components/configurator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface OptionGroup {
  id: string;
  type: string;
  name: string;
  required: boolean;
  options: {
    id: string;
    name: string;
    code: string | null;
    imageUrl: string | null;
    priceDelta: string | null;
    priceCurrency: string | null;
    priceKnown: boolean;
    available: boolean;
  }[];
}

interface Model {
  modelId: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelVersionId: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  rangeKm: number | null;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

interface Trim {
  id: string;
  name: string;
  slug: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  rangeKm: number | null;
  basePrice: string | null;
  modelVersionId: string;
  modelVersionName: string;
}

interface HomeCarGridProps {
  models: Model[];
  trimsByModel: Record<string, Trim[]>;
  configOptions: Record<string, OptionGroup[]>;
}

function formatPrice(price: string | null): string {
  if (!price || price === "0") return "Цена уточняется";
  const num = Number(price);
  if (num === 0) return "Цена уточняется";
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

export function HomeCarGrid({ models, trimsByModel, configOptions }: HomeCarGridProps) {
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);
  const [selectedTrimIds, setSelectedTrimIds] = useState<Record<string, string>>({});

  function handleToggle(modelId: string) {
    setExpandedModelId((prev) => (prev === modelId ? null : modelId));
  }

  function handleSelectTrim(modelId: string, trimId: string) {
    setSelectedTrimIds((prev) => ({ ...prev, [modelId]: trimId }));
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {models.map((model) => {
        const isExpanded = expandedModelId === model.modelId;
        const trims = trimsByModel[model.modelId] || [];
        const hasMultipleTrims = trims.length > 1;
        const selectedTrimId = selectedTrimIds[model.modelId] || model.trimId;
        const selectedTrim = trims.find((t) => t.id === selectedTrimId) || trims[0];
        const groups = configOptions[selectedTrimId] || [];
        const hasConfig = groups.length > 0;

        return (
          <div key={model.modelId} className="contents">
            <CarCard
              brandName={model.brandName}
              brandSlug={model.brandSlug}
              modelName={model.modelName}
              modelSlug={model.modelSlug}
              trimName={model.trimName}
              trimSlug={model.trimSlug}
              powertrainType={model.powertrainType}
              drivetrain={model.drivetrain}
              motorPowerKw={model.motorPowerKw}
              enginePowerHp={null}
              rangeKm={model.rangeKm}
              basePrice={model.basePrice}
              estimatedTotalUsd={model.estimatedTotalUsd}
              imageUrl={model.imageUrl}
              modelYear={null}
              onExpand={() => handleToggle(model.modelId)}
              isExpanded={isExpanded}
            />

            {isExpanded && (
              <div className="col-span-full -mt-2 mb-4">
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    {/* Trim selector */}
                    {hasMultipleTrims && (
                      <div className="mb-6">
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                          Комплектации
                        </h4>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {trims.map((trim) => (
                            <button
                              key={trim.id}
                              type="button"
                              onClick={() => handleSelectTrim(model.modelId, trim.id)}
                              className={`rounded-lg border p-3 text-left transition-all ${
                                selectedTrimId === trim.id
                                  ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{trim.name}</span>
                                <span className="text-sm font-bold">{formatPrice(trim.basePrice)}</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {trim.powertrainType && (
                                  <Badge variant={trim.powertrainType === "bev" ? "default" : "secondary"} className="text-[10px]">
                                    {powertrainLabel(trim.powertrainType)}
                                  </Badge>
                                )}
                                {trim.drivetrain && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {trim.drivetrain}
                                  </Badge>
                                )}
                                {trim.motorPowerKw && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {trim.motorPowerKw} кВт
                                  </Badge>
                                )}
                                {trim.rangeKm && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {trim.rangeKm} км
                                  </Badge>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Configurator + Details */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      {hasConfig ? (
                        <Configurator
                          groups={groups}
                          onConfigurationChange={() => {}}
                        />
                      ) : (
                        <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Конфигуратор недоступен
                        </div>
                      )}
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Базовая цена</div>
                          <div className="text-2xl font-bold">
                            {formatPrice(selectedTrim?.basePrice || model.basePrice)}
                          </div>
                        </div>
                        {model.estimatedTotalUsd && (
                          <div>
                            <div className="text-sm text-muted-foreground">Под ключ</div>
                            <div className="text-xl font-bold text-emerald-600">
                              {formatPrice(model.estimatedTotalUsd)}
                            </div>
                          </div>
                        )}
                        <Link href={`/cars/${selectedTrim?.slug || model.trimSlug}`}>
                          <Button size="lg" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Полные детали и заказ
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
