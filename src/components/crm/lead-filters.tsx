"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStatusOptions } from "./status-badge";
import { Search, X, Filter } from "lucide-react";

interface Manager {
  id: string;
  name: string;
}

interface LeadFiltersProps {
  managers: Manager[];
  currentFilters: {
    status?: string;
    assignedManagerId?: string;
    source?: string;
    search?: string;
  };
}

export function LeadFilters({ managers, currentFilters }: LeadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentFilters.search || "");

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/crm?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("search", search);
  }

  function clearFilters() {
    setSearch("");
    router.push("/crm");
  }

  const statusOptions = getStatusOptions();
  const hasFilters = currentFilters.status || currentFilters.assignedManagerId || currentFilters.source || currentFilters.search;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени, телефону, авто..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 sm:w-64"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary">
          Найти
        </Button>
      </form>

      <Select
        value={currentFilters.status || ""}
        onValueChange={(v) => updateFilter("status", v || "")}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все статусы</SelectItem>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentFilters.assignedManagerId || ""}
        onValueChange={(v) => updateFilter("assignedManagerId", v || "")}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Все менеджеры" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все менеджеры</SelectItem>
          {managers.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentFilters.source || ""}
        onValueChange={(v) => updateFilter("source", v || "")}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Все источники" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все источники</SelectItem>
          <SelectItem value="website">Сайт</SelectItem>
          <SelectItem value="configurator">Конфигуратор</SelectItem>
          <SelectItem value="calculator">Калькулятор</SelectItem>
          <SelectItem value="phone">Телефон</SelectItem>
          <SelectItem value="telegram">Telegram</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Сбросить
        </Button>
      )}
    </div>
  );
}
