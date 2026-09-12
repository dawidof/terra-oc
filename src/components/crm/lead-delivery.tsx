"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Eye, Link as LinkIcon, Loader2, Search, Truck, X } from "lucide-react";

import { AvailabilityBadge } from "@/components/availability-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/format";
import { getJourneyStage } from "@/lib/journey";

interface VehicleData {
  id: string;
  trimId: string;
  status: string;
  location: string | null;
  vin: string | null;
  expectedDate: string | null;
  reservedAt: string | null;
  trimName: string | null;
  modelName: string | null;
  brandName: string | null;
}

interface InventoryItem {
  id: string;
  trimName: string;
  modelName: string;
  brandName: string;
  status: string;
  location: string | null;
  vin: string | null;
  expectedDate: string | null;
}

interface LeadDeliveryProps {
  leadId: string;
  vehicle: VehicleData | null;
  journeyStage: number;
}

export function LeadDelivery({ leadId, vehicle, journeyStage }: LeadDeliveryProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "search">(vehicle ? "view" : "search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<InventoryItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [stageSuggestion, setStageSuggestion] = useState<{ stage: number; label: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const searchInventory = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/inventory?excludeReserved=true&q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.items);
      }
    } catch {
      console.error("Failed to search inventory");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchInventory(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchInventory]);

  async function handleLink(vehicleId: string) {
    setLinking(true);
    try {
      const res = await fetch(`/api/admin/inventory/${vehicleId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      if (res.ok) {
        toast.success("Автомобиль привязан");
        setMode("view");
        setSearchQuery("");
        setSearchResults([]);
        router.refresh();
        if (journeyStage < 2) {
          setStageSuggestion({ stage: 2, label: getJourneyStage(2).label });
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось привязать");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setLinking(false);
    }
  }

  async function handleAcceptStageSuggestion() {
    if (!stageSuggestion) return;
    const { stage } = stageSuggestion;
    setStageSuggestion(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journeyStage: stage }),
      });
      if (res.ok) {
        toast.success("Этап клиента обновлён");
        router.refresh();
      } else {
        toast.error("Не удалось обновить этап клиента");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function handleUnlink() {
    if (!vehicle) return;
    setUnlinking(true);
    try {
      const res = await fetch(`/api/admin/inventory/${vehicle.id}/reserve`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Автомобиль отвязан");
        setMode("search");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось отвязать");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setUnlinking(false);
    }
  }

  const stageDialog = (
    <AlertDialog
      open={stageSuggestion !== null}
      onOpenChange={(open) => !open && setStageSuggestion(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Обновить этап клиента?</AlertDialogTitle>
          <AlertDialogDescription>
            Автомобиль закреплён за заявкой. Предлагаем перевести клиента на этап
            «{stageSuggestion?.label}» — он увидит это в своём личном кабинете.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Оставить как есть</AlertDialogCancel>
          <AlertDialogAction onClick={handleAcceptStageSuggestion}>
            Перевести на этап
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (mode === "view" && vehicle) {
    return (
      <div className="flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Truck className="size-3.5" aria-hidden />
          Автомобиль в поставке
        </p>

        <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-medium">
                {vehicle.brandName} {vehicle.modelName}
              </div>
              <div className="text-xs text-muted-foreground">{vehicle.trimName}</div>
            </div>
            <AvailabilityBadge status={vehicle.status} />
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            {vehicle.vin && (
              <div>
                VIN: <span className="font-mono">{vehicle.vin}</span>
              </div>
            )}
            {vehicle.location && <div>Локация: {vehicle.location}</div>}
            {vehicle.expectedDate && (
              <div>Ожидается: {formatDate(vehicle.expectedDate)}</div>
            )}
            {vehicle.reservedAt && (
              <div>Привязан: {formatDate(vehicle.reservedAt)}</div>
            )}
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/portal?leadId=${leadId}`;
                navigator.clipboard.writeText(url);
                toast.success("Ссылка скопирована");
              }}
            >
              <LinkIcon className="size-3.5" />
              Ссылка клиенту
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/portal?leadId=${leadId}`, "_blank")}
            >
              <Eye className="size-3.5" />
              Открыть как клиент
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("/crm/deliveries", "_blank")}
            >
              <ExternalLink className="size-3.5" />
              Поставки
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnlink}
              disabled={unlinking}
              className="ml-auto text-muted-foreground hover:text-destructive"
            >
              {unlinking && <Loader2 className="size-3.5 animate-spin" />}
              Отвязать
            </Button>
          </div>
        </div>
        {stageDialog}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Truck className="size-3.5" aria-hidden />
          Автомобиль в поставке
        </p>
        {mode === "search" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode("view")}
            className="h-7 text-xs"
          >
            Назад
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1.5">
          <Label>Поиск автомобиля</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Марка, модель или VIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searching && (
              <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border text-sm">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLink(item.id)}
                disabled={linking}
                className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {item.brandName} {item.modelName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.trimName}
                    {item.vin && ` · ${item.vin}`}
                    {item.location && ` · ${item.location}`}
                  </span>
                </div>
                <AvailabilityBadge status={item.status} />
              </button>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Автомобили не найдены
          </p>
        )}

        {searchQuery.length < 2 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Введите минимум 2 символа для поиска
          </p>
        )}
      </div>
      {stageDialog}
    </div>
  );
}
