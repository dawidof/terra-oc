"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Package, Plus, Trash2 } from "lucide-react";

import { AvailabilityBadge } from "@/components/availability-badge";
import { Button } from "@/components/ui/button";
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

interface InventoryItem {
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
}

const STATUS_OPTIONS = [
  { value: "in_stock", label: "В наличии" },
  { value: "in_transit", label: "В пути" },
  { value: "on_order", label: "Под заказ" },
  { value: "reserved", label: "Забронирован" },
  { value: "sold", label: "Продан" },
];

export function InventoryManager() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("");

  useEffect(() => {
    fetchItems();
  }, [filterStatus]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
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
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        toast.success("Статус инвентаря обновлён");
        fetchItems();
        router.refresh();
      } else {
        toast.error("Не удалось обновить статус");
      }
    } catch {
      toast.error("Ошибка сети при обновлении статуса");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/inventory?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Позиция удалена");
        fetchItems();
        router.refresh();
      } else {
        toast.error("Не удалось удалить позицию");
      }
    } catch {
      toast.error("Ошибка сети при удалении");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Heading size="md">Инвентарь</Heading>
        <Button onClick={() => toast.info("Функция добавления в разработке")}>
          <Plus data-icon="inline-start" className="size-4" />
          Добавить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
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
            onClick={() => setFilterStatus(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Items list */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
          <Package className="mb-4 size-10 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Инвентарь пуст</p>
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
                  <div>
                    Ожидается: {new Date(item.expectedDate).toLocaleDateString("ru-RU")}
                  </div>
                )}
                {item.basePrice && <div>Цена: {formatUsd(item.basePrice)}</div>}
              </div>

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
                      <AlertDialogTitle>Удалить позицию?</AlertDialogTitle>
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
    </div>
  );
}
