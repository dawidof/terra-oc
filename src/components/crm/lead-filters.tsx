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
        items={[{ value: "all", label: "Все статусы" }, ...statusOptions]}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Все статусы" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="Все статусы">Все статусы</SelectItem>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} label={opt.label}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentFilters.assignedManagerId || ""}
        onValueChange={(v) => updateFilter("assignedManagerId", v || "")}
        items={[{ value: "all", label: "Все менеджеры" }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Все менеджеры" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="Все менеджеры">Все менеджеры</SelectItem>
          {managers.map((m) => (
            <SelectItem key={m.id} value={m.id} label={m.name}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentFilters.source || ""}
        onValueChange={(v) => updateFilter("source", v || "")}
        items={[
          { value: "all", label: "Все источники" },
          { value: "website", label: "Сайт" },
          { value: "configurator", label: "Конфигуратор" },
          { value: "calculator", label: "Калькулятор" },
          { value: "phone", label: "Телефон" },
          { value: "telegram", label: "Telegram" },
        ]}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Все источники" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" label="Все источники">Все источники</SelectItem>
          <SelectItem value="website" label="Сайт">Сайт</SelectItem>
          <SelectItem value="configurator" label="Конфигуратор">Конфигуратор</SelectItem>
          <SelectItem value="calculator" label="Калькулятор">Калькулятор</SelectItem>
          <SelectItem value="phone" label="Телефон">Телефон</SelectItem>
          <SelectItem value="telegram" label="Telegram">Telegram</SelectItem>
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
