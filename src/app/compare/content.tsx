"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Vehicle {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  batteryCapacityKwh: string | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

interface SpecRow {
  specName: string;
  groupName: string;
  values: (string | null)[];
}

function formatPrice(price: string | null): string {
  if (!price) return "—";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    default: return type || "—";
  }
}

export default function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [showDiffsOnly, setShowDiffsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carSlugs = searchParams.get("cars")?.split(",").filter(Boolean) || [];

  useEffect(() => {
    if (carSlugs.length === 0) {
      setLoading(false);
      return;
    }

    async function loadComparison() {
      try {
        const res = await fetch(
          `/api/compare?cars=${carSlugs.join(",")}`
        );
        const data = await res.json();
        setVehicles(data.vehicles || []);
        setSpecs(data.specs || []);
      } catch (err) {
        console.error("Failed to load comparison:", err);
      } finally {
        setLoading(false);
      }
    }

    loadComparison();
  }, [carSlugs.join(",")]);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search-trims?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.trims || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  function addVehicle(slug: string) {
    if (carSlugs.length >= 4) return;
    if (carSlugs.includes(slug)) return;
    const newSlugs = [...carSlugs, slug];
    router.push(`/compare?cars=${newSlugs.join(",")}`);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removeVehicle(slug: string) {
    const newSlugs = carSlugs.filter((s) => s !== slug);
    if (newSlugs.length === 0) {
      router.push("/compare");
    } else {
      router.push(`/compare?cars=${newSlugs.join(",")}`);
    }
  }

  const filteredSpecs = showDiffsOnly
    ? specs.filter((row) => {
        const unique = new Set(row.values.filter((v) => v !== null));
        return unique.size > 1;
      })
    : specs;

  const grouped: Record<string, SpecRow[]> = {};
  for (const spec of filteredSpecs) {
    if (!grouped[spec.groupName]) {
      grouped[spec.groupName] = [];
    }
    grouped[spec.groupName].push(spec);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Сравнение автомобилей</h1>

        {carSlugs.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="mb-4 text-xl font-semibold">Добавьте автомобили для сравнения</h2>
            <p className="mb-6 text-muted-foreground">
              Выберите до 4 автомобилей из каталога для сравнения характеристик
            </p>
            <div className="mx-auto max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск автомобиля..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 rounded-lg border bg-white shadow-lg">
                  {searchResults.map((r: any) => (
                    <button
                      key={r.trimSlug}
                      onClick={() => addVehicle(r.trimSlug)}
                      className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-gray-50"
                    >
                      <span>
                        {r.brandName} {r.modelName} {r.trimName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(r.basePrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link href="/cars" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">
              Или перейти в каталог →
            </Link>
          </div>
        ) : (
          <>
            {/* Vehicle headers */}
            <div className="mb-6 flex gap-4 overflow-x-auto pb-4">
              {vehicles.map((v) => (
                <Card key={v.trimId} className="min-w-[200px] shrink-0">
                  <CardContent className="relative p-4">
                    <button
                      onClick={() => removeVehicle(v.trimSlug)}
                      className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-gray-100">
                      {v.imageUrl ? (
                        <Image
                          src={v.imageUrl}
                          alt={`${v.brandName} ${v.modelName}`}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                          Фото
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{v.brandName}</div>
                    <div className="font-semibold">{v.modelName}</div>
                    <div className="text-sm text-muted-foreground">{v.trimName}</div>
                    <div className="mt-2 text-lg font-bold">{formatPrice(v.basePrice)}</div>
                    {v.estimatedTotalUsd && (
                      <div className="text-xs text-emerald-600">
                        под ключ: {formatPrice(v.estimatedTotalUsd)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {carSlugs.length < 4 && (
                <Card className="min-w-[200px] shrink-0">
                  <CardContent className="flex flex-col items-center justify-center p-4">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Добавить авто..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 w-full rounded-lg border bg-white shadow-lg">
                        {searchResults.slice(0, 5).map((r: any) => (
                          <button
                            key={r.trimSlug}
                            onClick={() => addVehicle(r.trimSlug)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            <span>
                              {r.brandName} {r.modelName}
                            </span>
                            <span className="text-muted-foreground">{r.trimName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery.length < 2 && (
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        Поиск по марке или модели
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Controls */}
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

            {/* Comparison table */}
            {vehicles.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 pr-4 text-left text-muted-foreground">
                        Характеристика
                      </th>
                      {vehicles.map((v) => (
                        <th key={v.trimId} className="py-3 px-4 text-center">
                          {v.brandName} {v.modelName}
                          <br />
                          <span className="font-normal text-muted-foreground">
                            {v.trimName}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Цена</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center font-semibold">
                          {formatPrice(v.basePrice)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Под ключ</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center text-emerald-600">
                          {formatPrice(v.estimatedTotalUsd)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Тип привода</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center">
                          <Badge variant={v.powertrainType === "bev" ? "default" : "secondary"}>
                            {powertrainLabel(v.powertrainType)}
                          </Badge>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Привод</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center">
                          {v.drivetrain || "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Мощность</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center">
                          {v.motorPowerKw ? `${v.motorPowerKw} кВт` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Батарея</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center">
                          {v.batteryCapacityKwh ? `${v.batteryCapacityKwh} кВт·ч` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">Запас хода</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center">
                          {v.rangeKm ? `${v.rangeKm} км` : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b bg-gray-50">
                      <td className="py-2 pr-4 font-medium">0-100 км/ч</td>
                      {vehicles.map((v) => (
                        <td key={v.trimId} className="py-2 px-4 text-center">
                          {v.acceleration0100 ? `${v.acceleration0100} сек` : "—"}
                        </td>
                      ))}
                    </tr>

                    {Object.entries(grouped).map(([groupName, rows]) => (
                      <React.Fragment key={groupName}>
                        <tr className="border-t-2">
                          <td
                            colSpan={vehicles.length + 1}
                            className="py-3 pr-4 font-semibold"
                          >
                            {groupName}
                          </td>
                        </tr>
                        {rows.map((row, i) => (
                          <tr key={`${groupName}-${i}`} className="border-b">
                            <td className="py-2 pr-4 text-muted-foreground">
                              {row.specName}
                            </td>
                            {row.values.map((value, j) => (
                              <td key={j} className="py-2 px-4 text-center">
                                {value || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
