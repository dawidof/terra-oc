"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Plus, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatUsd } from "@/lib/format";

interface TrimResult {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  powertrainType: string | null;
  imageUrl: string | null;
}

interface CatalogResult {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

interface AddCarDialogProps {
  leadId: string;
  addedTrimIds: string[];
  onAdded: () => void;
}

export function AddCarDialog({ leadId, addedTrimIds, onAdded }: AddCarDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrimResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [catalogBrand, setCatalogBrand] = useState("all");
  const [catalogBodyType, setCatalogBodyType] = useState("all");
  const [catalogResults, setCatalogResults] = useState<CatalogResult[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);

  const [brands, setBrands] = useState<{ value: string; label: string }[]>([]);

  const addedSet = new Set(addedTrimIds);

  useEffect(() => {
    if (!open) return;
    fetch("/api/brands")
      .then((r) => r.json())
      .then((data) => {
        if (data.brands) {
          setBrands(data.brands.map((b: { slug: string; name: string }) => ({ value: b.slug, label: b.name })));
        }
      })
      .catch(() => {});
  }, [open]);

  const searchTrims = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search-trims?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.trims || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchTrims(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchTrims]);

  const loadCatalog = useCallback(async (page: number) => {
    setCatalogLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      if (catalogBrand !== "all") params.set("brand", catalogBrand);
      if (catalogBodyType !== "all") params.set("bodyType", catalogBodyType);
      const res = await fetch(`/api/cars?${params.toString()}`);
      const data = await res.json();
      setCatalogResults(data.cars || []);
      setCatalogTotal(data.total || 0);
    } catch {
      setCatalogResults([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogBrand, catalogBodyType]);

  useEffect(() => {
    if (open) loadCatalog(1);
  }, [open, loadCatalog]);

  useEffect(() => {
    setCatalogPage(1);
    loadCatalog(1);
  }, [catalogBrand, catalogBodyType, loadCatalog]);

  async function addCar(trimId: string) {
    try {
      const res = await fetch(`/api/leads/${leadId}/proposed-cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trimId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Не удалось добавить");
        return;
      }
      toast.success("Автомобиль добавлен");
      onAdded();
    } catch {
      toast.error("Ошибка сети");
    }
  }

  function renderResultCard(car: TrimResult | CatalogResult) {
    const isAdded = addedSet.has(car.trimId);
    return (
      <div
        key={car.trimId}
        className="flex items-center gap-3 rounded-lg border border-border p-2.5"
      >
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
          {car.imageUrl ? (
            <Image
              src={car.imageUrl}
              alt={`${car.brandName} ${car.modelName}`}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
              Фото
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{car.brandName}</p>
          <p className="text-sm font-medium truncate">
            {car.modelName} <span className="font-normal text-muted-foreground">{car.trimName}</span>
          </p>
          {(car as TrimResult).powertrainType && (
            <Badge variant="secondary" className="mt-0.5 text-[10px] font-normal">
              {(car as TrimResult).powertrainType}
            </Badge>
          )}
          {car.estimatedTotalUsd && (
            <p className="mt-0.5 text-xs font-semibold tabular-nums text-brand">
              {formatUsd(car.estimatedTotalUsd)}
            </p>
          )}
        </div>
        <Button
          size="sm"
          variant={isAdded ? "outline" : "default"}
          disabled={isAdded}
          onClick={() => addCar(car.trimId)}
          className="shrink-0"
        >
          {isAdded ? (
            "Добавлен"
          ) : (
            <>
              <Plus data-icon="inline-start" className="size-3.5" />
              Добавить
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button size="sm" />}
      >
        <Plus data-icon="inline-start" className="size-3.5" />
        Добавить автомобиль
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Добавить автомобиль</SheetTitle>
          <SheetDescription>
            Найдите автомобиль по названию или выберите из каталога
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="search" className="px-4">
          <TabsList>
            <TabsTrigger value="search">
              <Search data-icon="inline-start" className="size-3.5" />
              Поиск
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <SlidersHorizontal data-icon="inline-start" className="size-3.5" />
              Каталог
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-3 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Например: BYD Seal, Tesla Model 3..."
                className="pl-8"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {searching && (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Ничего не найдено
                </p>
              )}
              {searchResults.map(renderResultCard)}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="mt-3 flex flex-col gap-3">
            <div className="flex gap-2">
              <Select
                value={catalogBrand}
                onValueChange={(v) => setCatalogBrand(v || "all")}
                items={[{ value: "all", label: "Все бренды" }, ...brands]}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Все бренды" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="Все бренды">Все бренды</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.value} value={b.value} label={b.label}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={catalogBodyType}
                onValueChange={(v) => setCatalogBodyType(v || "all")}
                items={[
                  { value: "all", label: "Все типы" },
                  { value: "sedan", label: "Седан" },
                  { value: "suv", label: "Кроссовер" },
                  { value: "hatchback", label: "Хэтчбек" },
                  { value: "wagon", label: "Универсал" },
                  { value: "coupe", label: "Купе" },
                  { value: "mpv", label: "Минивэн" },
                ]}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" label="Все типы">Все типы</SelectItem>
                  <SelectItem value="sedan" label="Седан">Седан</SelectItem>
                  <SelectItem value="suv" label="Кроссовер">Кроссовер</SelectItem>
                  <SelectItem value="hatchback" label="Хэтчбек">Хэтчбек</SelectItem>
                  <SelectItem value="wagon" label="Универсал">Универсал</SelectItem>
                  <SelectItem value="coupe" label="Купе">Купе</SelectItem>
                  <SelectItem value="mpv" label="Минивэн">Минивэн</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
              {catalogLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!catalogLoading && catalogResults.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Автомобили не найдены
                </p>
              )}
              {catalogResults.map(renderResultCard)}
            </div>

            {catalogTotal > 12 && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  Показано {Math.min(catalogPage * 12, catalogTotal)} из {catalogTotal}
                </p>
                <div className="flex gap-2">
                  {catalogPage > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setCatalogPage((p) => p - 1); loadCatalog(catalogPage - 1); }}
                    >
                      Назад
                    </Button>
                  )}
                  {catalogPage * 12 < catalogTotal && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setCatalogPage((p) => p + 1); loadCatalog(catalogPage + 1); }}
                    >
                      Далее
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
