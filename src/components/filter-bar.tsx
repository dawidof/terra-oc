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
import { Search } from "lucide-react";

interface FilterBarProps {
  brands: { name: string; slug: string }[];
}

export function FilterBar({ brands }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

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

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
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

      <div className="flex flex-wrap gap-2">
        <Select
          value={searchParams.get("brand") || ""}
          onValueChange={(v) => handleFilterChange("brand", v)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Марка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все марки</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.slug} value={b.slug}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("powertrain") || ""}
          onValueChange={(v) => handleFilterChange("powertrain", v)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Тип топлива" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любой</SelectItem>
            <SelectItem value="bev">Электро</SelectItem>
            <SelectItem value="phev">Гибрид</SelectItem>
            <SelectItem value="petrol">Бензин</SelectItem>
            <SelectItem value="diesel">Дизель</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("bodyType") || ""}
          onValueChange={(v) => handleFilterChange("bodyType", v)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Кузов" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Любой</SelectItem>
            <SelectItem value="SUV">Кроссовер</SelectItem>
            <SelectItem value="sedan">Седан</SelectItem>
            <SelectItem value="hatchback">Хэтчбек</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") || "popular"}
          onValueChange={(v) => handleFilterChange("sort", v)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Популярные</SelectItem>
            <SelectItem value="price_asc">Цена ↑</SelectItem>
            <SelectItem value="price_desc">Цена ↓</SelectItem>
            <SelectItem value="newest">Новинки</SelectItem>
            <SelectItem value="power">Мощность</SelectItem>
            <SelectItem value="range">Запас хода</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
