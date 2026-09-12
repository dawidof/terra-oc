"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Trash2,
  UserCheck,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { AvailabilityBadge } from "@/components/availability-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeliveryAddForm } from "@/components/crm/delivery-add-form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Heading } from "@/components/ui/section";
import { formatUsd } from "@/lib/format";
import { getJourneyStage, SUGGESTED_STAGE_BY_VEHICLE_STATUS } from "@/lib/journey";

interface DeliveryItem {
  id: string;
  trimId: string;
  status: string;
  location: string | null;
  vin: string | null;
  expectedDate: string | null;
  reservedBy: string | null;
  reservedAt: string | null;
  notes: string | null;
  createdAt: string;
  trimName: string;
  trimSlug: string;
  basePrice: string | null;
  powertrainType: string | null;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  reservedLeadId: string | null;
  reservedCustomerName: string | null;
  reservedCustomerPhone: string | null;
  reservedJourneyStage: number | null;
}

const STATUS_OPTIONS = [
  { value: "in_transit", label: "В пути" },
  { value: "on_order", label: "Под заказ" },
  { value: "reserved", label: "Забронирован" },
  { value: "sold", label: "Продан" },
];

interface JourneySuggestion {
  leadId: string;
  stage: number;
  label: string;
}

export function DeliveriesManager() {
  const router = useRouter();
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [reservedFilter, setReservedFilter] = useState<"all" | "free" | "reserved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [journeySuggestion, setJourneySuggestion] = useState<JourneySuggestion | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (reservedFilter === "free") params.set("excludeReserved", "true");
      if (reservedFilter === "reserved") params.set("reservedOnly", "true");
      if (searchQuery.trim().length >= 2) params.set("q", searchQuery.trim());
      const res = await fetch(`/api/admin/inventory?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, reservedFilter, searchQuery]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => fetchItems(), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [fetchItems]);

  function checkJourneySuggestion(item: DeliveryItem, newStatus: string) {
    const suggestedStage = SUGGESTED_STAGE_BY_VEHICLE_STATUS[newStatus];
    if (
      !suggestedStage ||
      !item.reservedLeadId ||
      item.reservedJourneyStage === null ||
      item.reservedJourneyStage === undefined ||
      item.reservedJourneyStage >= suggestedStage
    ) {
      return;
    }
    setJourneySuggestion({
      leadId: item.reservedLeadId,
      stage: suggestedStage,
      label: getJourneyStage(suggestedStage).label,
    });
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const item = items.find((i) => i.id === id);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        toast.success("Статус автомобиля обновлён");
        fetchItems();
        router.refresh();
        if (item) checkJourneySuggestion(item, newStatus);
      } else {
        toast.error("Не удалось обновить статус");
      }
    } catch {
      toast.error("Ошибка сети при обновлении статуса");
    }
  }

  async function handleAcceptJourneySuggestion() {
    if (!journeySuggestion) return;
    const { leadId, stage } = journeySuggestion;
    setJourneySuggestion(null);
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

  async function handleUnreserve(id: string) {
    try {
      const res = await fetch(`/api/admin/inventory/${id}/reserve`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Бронирование отменено");
        fetchItems();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось отменить бронирование");
      }
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Автомобиль удалён");
        fetchItems();
        router.refresh();
      } else {
        toast.error("Не удалось удалить автомобиль");
      }
    } catch {
      toast.error("Ошибка сети при удалении");
    }
  }

  function isOverdue(item: DeliveryItem): boolean {
    if (!item.expectedDate) return false;
    if (!["on_order", "in_transit"].includes(item.status)) return false;
    return new Date(item.expectedDate).getTime() < Date.now();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading size="md">Поставки</Heading>
        <Button onClick={() => setAddFormOpen(true)}>
          <Plus data-icon="inline-start" className="size-4" />
          Добавить
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по марке, модели, VIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
          {loading && searchQuery.length >= 2 && (
            <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filterStatus === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("")}
          >
            Все
          </Button>
          {STATUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={filterStatus === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(filterStatus === opt.value ? "" : opt.value)}
            >
              {opt.label}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <Button
            variant={reservedFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setReservedFilter("all")}
          >
            Все авто
          </Button>
          <Button
            variant={reservedFilter === "free" ? "default" : "outline"}
            size="sm"
            onClick={() => setReservedFilter(reservedFilter === "free" ? "all" : "free")}
          >
            Свободные
          </Button>
          <Button
            variant={reservedFilter === "reserved" ? "default" : "outline"}
            size="sm"
            onClick={() => setReservedFilter(reservedFilter === "reserved" ? "all" : "reserved")}
          >
            Забронированные
          </Button>
        </div>
      </div>

      {/* Items list */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
          <Package className="mb-4 size-10 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Поставок пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">
                    {item.brandName} {item.modelName}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.trimName}</div>
                </div>
                <AvailabilityBadge status={item.status} />
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {item.vin && (
                  <div>
                    VIN: <span className="font-mono">{item.vin}</span>
                  </div>
                )}
                {item.location && <div>Локация: {item.location}</div>}
                {item.expectedDate && (
                  <div className={isOverdue(item) ? "font-medium text-red-600" : undefined}>
                    Ожидается: {new Date(item.expectedDate).toLocaleDateString("ru-RU")}
                    {isOverdue(item) && " · просрочено"}
                  </div>
                )}
                {item.basePrice && <div>Цена: {formatUsd(item.basePrice)}</div>}
              </div>

              {item.reservedLeadId && item.reservedCustomerName && (
                <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2 text-xs ring-1 ring-purple-200">
                  <UserCheck className="size-3.5 shrink-0 text-purple-600" />
                  <div className="flex-1 truncate">
                    <span className="font-medium">{item.reservedCustomerName}</span>
                    {item.reservedCustomerPhone && (
                      <span className="text-muted-foreground ml-1">{item.reservedCustomerPhone}</span>
                    )}
                  </div>
                  <Link
                    href={`/crm/leads/${item.reservedLeadId}`}
                    target="_blank"
                    className="shrink-0 text-purple-600 hover:text-purple-800"
                    title="Открыть заявку"
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-2">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {item.reservedBy && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnreserve(item.id)}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    Отвязать
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="icon" className="size-7 shrink-0 text-muted-foreground hover:text-destructive" />
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить автомобиль?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {item.brandName} {item.modelName} — {item.trimName}. Это действие
                        нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {item.notes && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {item.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Journey sync suggestion */}
      <AlertDialog
        open={journeySuggestion !== null}
        onOpenChange={(open) => !open && setJourneySuggestion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Обновить этап клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Статус автомобиля изменился. Предлагаем перевести клиента на этап
              «{journeySuggestion?.label}» — он увидит это в своём личном кабинете.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Оставить как есть</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptJourneySuggestion}>
              Перевести на этап
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeliveryAddForm
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        onCreated={() => {
          fetchItems();
          router.refresh();
        }}
      />
    </div>
  );
}
