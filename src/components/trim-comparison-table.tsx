"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ComparisonRow } from "@/lib/compare";

interface TrimComparisonTableProps {
  trims: {
    id: string;
    name: string;
    slug: string;
    powertrainType: string | null;
    drivetrain: string | null;
    motorPowerKw: number | null;
    batteryCapacityKwh: string | null;
    rangeKm: number | null;
    acceleration0100: string | null;
    basePrice: string | null;
  }[];
  specs: ComparisonRow[];
  currentSlug: string;
}

function formatPrice(price: string | null): string {
  if (!price) return "—";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "hev": return "Гибрид";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    default: return type || "—";
  }
}

export function TrimComparisonTable({ trims, specs, currentSlug }: TrimComparisonTableProps) {
  const [showDiffsOnly, setShowDiffsOnly] = useState(false);

  const filteredSpecs = showDiffsOnly
    ? specs.filter((row) => {
        const unique = new Set(row.values.filter((v) => v !== null));
        return unique.size > 1;
      })
    : specs;

  // Group specs by group name
  const grouped: Record<string, ComparisonRow[]> = {};
  for (const spec of filteredSpecs) {
    if (!grouped[spec.groupName]) {
      grouped[spec.groupName] = [];
    }
    grouped[spec.groupName].push(spec);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Checkbox
          id="diffs-only"
          checked={showDiffsOnly}
          onCheckedChange={(checked) => setShowDiffsOnly(checked === true)}
        />
        <Label htmlFor="diffs-only" className="text-sm">
          Показывать только отличия
        </Label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-3 pr-4 text-left text-muted-foreground">Характеристика</th>
              {trims.map((trim) => (
                <th
                  key={trim.id}
                  className={`py-3 px-4 text-center ${
                    trim.slug === currentSlug ? "bg-emerald-50 font-semibold" : ""
                  }`}
                >
                  <div>{trim.name}</div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {formatPrice(trim.basePrice)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Key commercial specs first */}
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">Цена</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center font-semibold">
                  {formatPrice(trim.basePrice)}
                </td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">Тип привода</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center">
                  <Badge variant={trim.powertrainType === "bev" ? "default" : "secondary"}>
                    {powertrainLabel(trim.powertrainType)}
                  </Badge>
                </td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">Привод</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center">
                  {trim.drivetrain || "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">Мощность</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center">
                  {trim.motorPowerKw ? `${trim.motorPowerKw} кВт` : "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">Батарея</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center">
                  {trim.batteryCapacityKwh ? `${trim.batteryCapacityKwh} кВт·ч` : "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">Запас хода</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center">
                  {trim.rangeKm ? `${trim.rangeKm} км` : "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b bg-gray-50">
              <td className="py-2 pr-4 font-medium">0-100 км/ч</td>
              {trims.map((trim) => (
                <td key={trim.id} className="py-2 px-4 text-center">
                  {trim.acceleration0100 ? `${trim.acceleration0100} сек` : "—"}
                </td>
              ))}
            </tr>

            {/* Spec groups */}
            {Object.entries(grouped).map(([groupName, rows]) => [
              <tr key={`group-${groupName}`} className="border-t-2">
                <td
                  colSpan={trims.length + 1}
                  className="py-3 pr-4 font-semibold"
                >
                  {groupName}
                </td>
              </tr>,
              ...rows.map((row) => (
                <tr key={row.specSlug} className="border-b">
                  <td className="py-2 pr-4 text-muted-foreground">{row.specName}</td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={`py-2 px-4 text-center ${
                        trims[i]?.slug === currentSlug ? "bg-emerald-50" : ""
                      }`}
                    >
                      {value || "—"}
                    </td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
