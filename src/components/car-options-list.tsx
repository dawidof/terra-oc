"use client";

import { useState } from "react";
import { Check } from "lucide-react";

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

interface CarOptionsListProps {
  optionGroups: OptionGroup[];
  initialVisibleCount?: number;
}

const HIDDEN_TYPES = new Set(["exterior_color", "interior_color", "wheels"]);

export function CarOptionsList({
  optionGroups,
  initialVisibleCount = 8,
}: CarOptionsListProps) {
  const [expanded, setExpanded] = useState(false);

  const displayGroups = optionGroups
    .filter((g) => !HIDDEN_TYPES.has(g.type))
    .map((g) => ({
      ...g,
      options: g.options.filter((o) => o.available),
    }))
    .filter((g) => g.options.length > 0);

  const allOptions = displayGroups.flatMap((g) => g.options);
  const visibleOptions = expanded
    ? allOptions
    : allOptions.slice(0, initialVisibleCount);
  const hiddenCount = allOptions.length - initialVisibleCount;

  if (allOptions.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Комплектация</h3>
      <div className="divide-y rounded-lg border">
        {visibleOptions.map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-3 px-4 py-2.5 text-sm"
          >
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{option.name}</span>
          </div>
        ))}
      </div>
      {!expanded && hiddenCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Показать ещё {hiddenCount} опций
        </button>
      )}
      {expanded && allOptions.length > initialVisibleCount && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Свернуть
        </button>
      )}
    </div>
  );
}
