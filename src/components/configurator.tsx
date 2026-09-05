"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Check } from "lucide-react";

interface ColorImage {
  url: string;
  alt?: string | null;
}

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

interface ConfiguratorProps {
  groups: OptionGroup[];
  colorImages?: Record<string, ColorImage[]>;
  onConfigurationChange: (config: {
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options: string[];
    unpriced_options: string[];
    totalDelta: number;
  }) => void;
  onColorSelect?: (groupId: string, optionId: string, images: ColorImage[]) => void;
}

function formatDelta(delta: number | null): string {
  if (!delta || delta === 0) return "";
  return delta > 0 ? `+$${delta.toLocaleString("en-US")}` : `-$${Math.abs(delta).toLocaleString("en-US")}`;
}

function groupTypeLabel(type: string): string {
  switch (type) {
    case "exterior_color": return "Цвет кузова";
    case "interior_color": return "Цвет салона";
    case "wheels": return "Колёса";
    case "package": return "Пакеты";
    case "standalone_option": return "Опции";
    default: return type;
  }
}

export function Configurator({
  groups,
  colorImages = {},
  onConfigurationChange,
  onColorSelect,
}: ConfiguratorProps) {
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [expandedSwatch, setExpandedSwatch] = useState<string | null>(null);

  function handleGroupSelect(groupId: string, optionId: string) {
    const newSelections = { ...selections, [groupId]: optionId };
    setSelections(newSelections);
    emitChange(newSelections, selectedOptions);

    const group = groups.find((g) => g.id === groupId);
    if (group && (group.type === "exterior_color" || group.type === "interior_color")) {
      const images = colorImages[optionId] || [];
      onColorSelect?.(groupId, optionId, images);
    }
  }

  function handleOptionToggle(optionId: string) {
    const newOptions = selectedOptions.includes(optionId)
      ? selectedOptions.filter((id) => id !== optionId)
      : [...selectedOptions, optionId];
    setSelectedOptions(newOptions);
    emitChange(selections, newOptions);
  }

  function emitChange(currentSelections: Record<string, string | null>, currentOptions: string[]) {
    let totalDelta = 0;
    const unpricedOptions: string[] = [];
    const config: Record<string, string> = {};

    for (const group of groups) {
      const selectedOptionId = currentSelections[group.id];
      if (!selectedOptionId) continue;

      const option = group.options.find((o) => o.id === selectedOptionId);
      if (!option) continue;

      if (group.type === "exterior_color") config.exterior_color = option.name;
      if (group.type === "interior_color") config.interior_color = option.name;
      if (group.type === "wheels") config.wheels = option.name;

      if (option.priceKnown && option.priceDelta) {
        totalDelta += Number(option.priceDelta);
      } else if (!option.priceKnown) {
        unpricedOptions.push(option.name);
      }
    }

    for (const optionId of currentOptions) {
      for (const group of groups) {
        const option = group.options.find((o) => o.id === optionId);
        if (option) {
          if (option.priceKnown && option.priceDelta) {
            totalDelta += Number(option.priceDelta);
          } else if (!option.priceKnown) {
            unpricedOptions.push(option.name);
          }
        }
      }
    }

    onConfigurationChange({
      exterior_color: config.exterior_color,
      interior_color: config.interior_color,
      wheels: config.wheels,
      options: currentOptions.map((id) => {
        for (const group of groups) {
          const opt = group.options.find((o) => o.id === id);
          if (opt) return opt.name;
        }
        return id;
      }),
      unpriced_options: unpricedOptions,
      totalDelta,
    });
  }

  if (groups.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Конфигурация
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {groups.map((group) => (
          <div key={group.id}>
            <h4 className="mb-3 text-sm font-medium">
              {groupTypeLabel(group.type)}
              {group.required && <span className="ml-1 text-destructive">*</span>}
            </h4>

            {group.type === "exterior_color" || group.type === "interior_color" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {group.options.filter((o) => o.available).map((option) => {
                    const isSelected = selections[group.id] === option.id;
                    const delta = option.priceKnown && option.priceDelta ? Number(option.priceDelta) : null;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleGroupSelect(group.id, option.id)}
                        className={`group relative flex items-center gap-2 rounded-lg border p-2 transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600">
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                        {option.imageUrl && (
                          <div
                            className="relative h-8 w-8 flex-shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110"
                            style={{ backgroundColor: option.imageUrl }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSwatch(expandedSwatch === option.id ? null : option.id);
                            }}
                          />
                        )}
                        <div className="flex flex-col items-start">
                          <span className="text-sm leading-tight">{option.name}</span>
                          {delta !== null && delta !== 0 ? (
                            <span className={`text-xs font-medium ${delta > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                              {formatDelta(delta)}
                            </span>
                          ) : !option.priceKnown ? (
                            <Badge variant="secondary" className="mt-0.5 text-[10px]">
                              цена уточняется
                            </Badge>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {expandedSwatch && (() => {
                  const group2 = groups.find((g) => g.id === group.id);
                  const opt = group2?.options.find((o) => o.id === expandedSwatch);
                  const images = colorImages[expandedSwatch] || [];
                  if (!opt) return null;

                  return (
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className="h-16 w-16 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: opt.imageUrl || "#ccc" }}
                          />
                          <span className="text-xs font-medium">{opt.name}</span>
                        </div>
                        {images.length > 0 && (
                          <div className="flex-1">
                            <p className="mb-2 text-xs text-muted-foreground">Предпросмотр цвета:</p>
                            <div className="flex gap-2 overflow-x-auto">
                              {images.map((img, i) => (
                                <div key={i} className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-white">
                                  <Image
                                    src={img.url}
                                    alt={img.alt || opt.name}
                                    fill
                                    className="object-cover"
                                    sizes="112px"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : group.type === "wheels" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.options.filter((o) => o.available).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleGroupSelect(group.id, option.id)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      selections[group.id] === option.id
                        ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-sm font-medium">{option.name}</div>
                    {option.priceKnown && option.priceDelta ? (
                      <div className="text-xs text-muted-foreground">
                        {formatDelta(Number(option.priceDelta))}
                      </div>
                    ) : !option.priceKnown ? (
                      <div className="text-[10px] text-muted-foreground">цена уточняется</div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {group.options.filter((o) => o.available).map((option) => (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all ${
                      selectedOptions.includes(option.id)
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(option.id)}
                        onChange={() => handleOptionToggle(option.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{option.name}</span>
                    </div>
                    {option.priceKnown && option.priceDelta ? (
                      <span className="text-sm font-medium">
                        {formatDelta(Number(option.priceDelta))}
                      </span>
                    ) : !option.priceKnown ? (
                      <Badge variant="secondary" className="text-[10px]">
                        цена уточняется
                      </Badge>
                    ) : null}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
