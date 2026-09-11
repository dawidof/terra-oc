"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const entityLabels: Record<string, string> = {
  user: "Пользователи",
  lead: "Заявки",
  review: "Отзывы",
  site_settings: "Настройки",
  trim: "Комплектации",
  offer: "Предложения",
};

export function AuditFilters({ entityTypes }: { entityTypes: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("entityType") || "all";

  function update(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("entityType", value);
    } else {
      params.delete("entityType");
    }
    params.delete("page");
    router.push(`/crm/audit?${params.toString()}`);
  }

  const options = entityTypes.map((type) => ({
    value: type,
    label: entityLabels[type] || type,
  }));

  return (
    <Select value={current} onValueChange={(v) => update(v || "all")} items={[{ value: "all", label: "Все типы" }, ...options]}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Все типы" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" label="Все типы">
          Все типы
        </SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} label={opt.label}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
