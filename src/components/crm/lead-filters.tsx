"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SOURCE_OPTIONS } from "./lead-source";
import { getStatusOptions } from "./status-badge";

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
  /** Route the filter state is written to. */
  basePath?: string;
}

export function LeadFilters({
  managers,
  currentFilters,
  basePath = "/crm/leads",
}: LeadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentFilters.search || "");

  const statusOptions = getStatusOptions();
  const hasFilters = Boolean(
    currentFilters.status ||
      currentFilters.assignedManagerId ||
      currentFilters.source ||
      currentFilters.search
  );

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    // "all" is a UI-only sentinel — never send it to the query layer.
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("search", search);
  }

  function clearFilters() {
    setSearch("");
    router.push(basePath);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Имя, телефон или автомобиль"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Найти
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={currentFilters.status || "all"}
          onValueChange={(v) => updateFilter("status", v || "")}
          items={[{ value: "all", label: "Все статусы" }, ...statusOptions]}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Все статусы">
              Все статусы
            </SelectItem>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.assignedManagerId || "all"}
          onValueChange={(v) => updateFilter("assignedManagerId", v || "")}
          items={[
            { value: "all", label: "Все менеджеры" },
            ...managers.map((m) => ({ value: m.id, label: m.name })),
          ]}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Все менеджеры" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Все менеджеры">
              Все менеджеры
            </SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id} label={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentFilters.source || "all"}
          onValueChange={(v) => updateFilter("source", v || "")}
          items={[{ value: "all", label: "Все источники" }, ...SOURCE_OPTIONS]}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Все источники" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" label="Все источники">
              Все источники
            </SelectItem>
            {SOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X data-icon="inline-start" className="size-3.5" />
            Сбросить
          </Button>
        )}
      </div>
    </div>
  );
}
