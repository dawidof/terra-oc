"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  brands: { name: string; slug: string }[];
  total: number;
}

export function FilterBar({ brands, total }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/cars?${createQueryString("search", search)}`);
  };

  const handleFilterChange = (name: string, value: string | null) => {
    router.push(`/cars?${createQueryString(name, value || "")}`);
  };

  const handleNumberFilter = (name: string, value: string) => {
    const num = Number(value);
    if (value && (!Number.isFinite(num) || num <= 0)) return;
    router.push(`/cars?${createQueryString(name, value || "")}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Марка или модель"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit">Найти</Button>
        </form>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-2"
        >
          <SlidersHorizontal className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Фильтры</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={searchParams.get("brand") || ""}
          onValueChange={(v) => handleFilterChange("brand", v)}
          items={[{ value: "all", label: "Все марки" }, ...brands.map((b) => ({ value: b.slug, label: b.name }))]}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Марка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Все марки">Все марки</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.slug} value={b.slug} label={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("powertrain") || ""}
          onValueChange={(v) => handleFilterChange("powertrain", v)}
          items={[
            { value: "all", label: "Любой" },
            { value: "bev", label: "Электро" },
            { value: "phev", label: "Гибрид" },
            { value: "petrol", label: "Бензин" },
            { value: "diesel", label: "Дизель" },
          ]}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Тип топлива" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Любой">Любой</SelectItem>
            <SelectItem value="bev" label="Электро">Электро</SelectItem>
            <SelectItem value="phev" label="Гибрид">Гибрид</SelectItem>
            <SelectItem value="petrol" label="Бензин">Бензин</SelectItem>
            <SelectItem value="diesel" label="Дизель">Дизель</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("bodyType") || ""}
          onValueChange={(v) => handleFilterChange("bodyType", v)}
          items={[
            { value: "all", label: "Любой" },
            { value: "SUV", label: "Кроссовер" },
            { value: "sedan", label: "Седан" },
            { value: "hatchback", label: "Хэтчбек" },
          ]}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Кузов" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Любой">Любой</SelectItem>
            <SelectItem value="SUV" label="Кроссовер">Кроссовер</SelectItem>
            <SelectItem value="sedan" label="Седан">Седан</SelectItem>
            <SelectItem value="hatchback" label="Хэтчбек">Хэтчбек</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") || "popular"}
          onValueChange={(v) => handleFilterChange("sort", v)}
          items={[
            { value: "popular", label: "Популярные" },
            { value: "price_asc", label: "Цена ↑" },
            { value: "price_desc", label: "Цена ↓" },
            { value: "newest", label: "Новинки" },
            { value: "power", label: "Мощность" },
            { value: "range", label: "Запас хода" },
          ]}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular" label="Популярные">Популярные</SelectItem>
            <SelectItem value="price_asc" label="Цена ↑">Цена ↑</SelectItem>
            <SelectItem value="price_desc" label="Цена ↓">Цена ↓</SelectItem>
            <SelectItem value="newest" label="Новинки">Новинки</SelectItem>
            <SelectItem value="power" label="Мощность">Мощность</SelectItem>
            <SelectItem value="range" label="Запас хода">Запас хода</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Цена от ($)</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              defaultValue={searchParams.get("priceFrom") || ""}
              onChange={(e) => handleNumberFilter("priceFrom", e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Цена до ($)</label>
            <Input
              type="number"
              placeholder="∞"
              min="0"
              defaultValue={searchParams.get("priceTo") || ""}
              onChange={(e) => handleNumberFilter("priceTo", e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Год от</label>
            <Input
              type="number"
              placeholder="1990"
              min="1990"
              max="2030"
              defaultValue={searchParams.get("yearFrom") || ""}
              onChange={(e) => handleNumberFilter("yearFrom", e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Год до</label>
            <Input
              type="number"
              placeholder="2030"
              min="1990"
              max="2030"
              defaultValue={searchParams.get("yearTo") || ""}
              onChange={(e) => handleNumberFilter("yearTo", e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Места</label>
            <Select
              value={searchParams.get("seats") || ""}
              onValueChange={(v) => handleFilterChange("seats", v || null)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Любые" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="Любые">Любые</SelectItem>
                <SelectItem value="5" label="5 мест" />
                <SelectItem value="7" label="7 мест" />
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Страна</label>
            <Input
              placeholder="Китай, Корея..."
              defaultValue={searchParams.get("sourceCountry") || ""}
              onChange={(e) => handleFilterChange("sourceCountry", e.target.value || null)}
              className="h-8"
            />
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Найдено: <span className="font-medium text-foreground">{total}</span>{" "}
        {total === 1 ? "автомобиль" : total < 5 ? "автомобиля" : "автомобилей"}
      </div>
    </div>
  );
}
