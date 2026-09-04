"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

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
  basePrice: number;
  onConfigurationChange: (config: {
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options: string[];
    unpriced_options: string[];
    totalDelta: number;
  }) => void;
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

export function Configurator({ groups, basePrice, onConfigurationChange }: ConfiguratorProps) {
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  function handleGroupSelect(groupId: string, optionId: string, optionName: string) {
    const newSelections = { ...selections, [groupId]: optionId };
    setSelections(newSelections);
    emitChange(newSelections, selectedOptions);
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
              <div className="flex flex-wrap gap-2">
                {group.options.filter((o) => o.available).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleGroupSelect(group.id, option.id, option.name)}
                    className={`flex items-center gap-2 rounded-lg border p-2 transition-all ${
                      selections[group.id] === option.id
                        ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {option.imageUrl && (
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: option.imageUrl }}
                      />
                    )}
                    <span className="text-sm">{option.name}</span>
                    {option.priceKnown && option.priceDelta && Number(option.priceDelta) !== 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {formatDelta(Number(option.priceDelta))}
                      </span>
                    ) : !option.priceKnown ? (
                      <Badge variant="secondary" className="text-[10px]">
                        цена уточняется
                      </Badge>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : group.type === "wheels" ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {group.options.filter((o) => o.available).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleGroupSelect(group.id, option.id, option.name)}
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
