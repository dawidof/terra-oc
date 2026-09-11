"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

interface TrimResult {
  trimId: string;
  trimName: string;
  modelName: string;
  brandName: string;
  basePrice: string | null;
  powertrainType: string | null;
}

interface DeliveryAddFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const STATUS_OPTIONS = [
  { value: "in_transit", label: "В пути" },
  { value: "on_order", label: "Под заказ" },
  { value: "reserved", label: "Забронирован" },
  { value: "sold", label: "Продан" },
];

export function DeliveryAddForm({
  open,
  onOpenChange,
  onCreated,
}: DeliveryAddFormProps) {
  const [trimQuery, setTrimQuery] = useState("");
  const [trimResults, setTrimResults] = useState<TrimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrim, setSelectedTrim] = useState<TrimResult | null>(null);
  const [status, setStatus] = useState("on_order");
  const [location, setLocation] = useState("");
  const [vin, setVin] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const searchTrims = useCallback(async (query: string) => {
    if (query.length < 2) {
      setTrimResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search-trims?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setTrimResults(data.trims);
      }
    } catch {
      console.error("Failed to search trims");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchTrims(trimQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimQuery, searchTrims]);

  function handleSelectTrim(trim: TrimResult) {
    setSelectedTrim(trim);
    setTrimQuery(`${trim.brandName} ${trim.modelName} — ${trim.trimName}`);
    setTrimResults([]);
  }

  function resetForm() {
    setTrimQuery("");
    setTrimResults([]);
    setSelectedTrim(null);
    setStatus("on_order");
    setLocation("");
    setVin("");
    setExpectedDate("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTrim) {
      toast.error("Выберите комплектацию");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trimId: selectedTrim.trimId,
          status,
          location: location || null,
          vin: vin || null,
          expectedDate: expectedDate || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        toast.success("Автомобиль добавлен");
        resetForm();
        onOpenChange(false);
        onCreated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось добавить автомобиль");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Добавить автомобиль</SheetTitle>
          <SheetDescription>
            Выберите комплектацию и заполните данные
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4">
          {/* Trim search */}
          <div className="flex flex-col gap-1.5">
            <Label>Комплектация *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Марка, модель или комплектация..."
                value={trimQuery}
                onChange={(e) => {
                  setTrimQuery(e.target.value);
                  setSelectedTrim(null);
                }}
                className="pl-8"
              />
              {searching && (
                <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>
            {trimResults.length > 0 && !selectedTrim && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-popover text-sm shadow-md">
                {trimResults.map((trim) => (
                  <button
                    key={trim.trimId}
                    type="button"
                    onClick={() => handleSelectTrim(trim)}
                    className="flex w-full flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">
                      {trim.brandName} {trim.modelName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {trim.trimName}
                      {trim.powertrainType && ` · ${trim.powertrainType}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selectedTrim && (
              <p className="text-xs text-muted-foreground">
                {selectedTrim.brandName} {selectedTrim.modelName} — {selectedTrim.trimName}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label>Статус *</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 w-full rounded-lg border border-border bg-transparent px-2.5 text-base md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <Label>Локация</Label>
            <Input
              placeholder="Ташкент, склад №2..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* VIN */}
          <div className="flex flex-col gap-1.5">
            <Label>VIN</Label>
            <Input
              placeholder="17-значный VIN-номер"
              value={vin}
              onChange={(e) => setVin(e.target.value.toUpperCase())}
              maxLength={17}
              className="font-mono"
            />
          </div>

          {/* Expected Date */}
          <div className="flex flex-col gap-1.5">
            <Label>Ожидаемая дата</Label>
            <Input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label>Заметки</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-transparent px-2.5 py-2 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              placeholder="Дополнительная информация..."
            />
          </div>

          <div className="flex-1" />

          <SheetFooter>
            <SheetClose
              render={<Button variant="outline" type="button" />}
            >
              Отмена
            </SheetClose>
            <Button type="submit" disabled={submitting || !selectedTrim}>
              {submitting && <Loader2 data-icon="inline-start" className="size-4 animate-spin" />}
              Добавить
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
