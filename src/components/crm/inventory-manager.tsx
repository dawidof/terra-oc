"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { Package, Plus, Edit2, Trash2 } from "lucide-react";

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
  const [showAddModal, setShowAddModal] = useState(false);

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
        fetchItems();
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update inventory:", error);
    }
  }

  function formatPrice(price: string | null): string {
    if (!price) return "—";
    return `$${Number(price).toLocaleString("en-US")}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Инвентарь</h2>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
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
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Инвентарь пуст</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {item.brandName} {item.modelName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.trimName}
                    </div>
                  </div>
                  <AvailabilityBadge status={item.status} />
                </div>

                <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                  {item.vin && (
                    <div>VIN: <span className="font-mono">{item.vin}</span></div>
                  )}
                  {item.location && <div>Локация: {item.location}</div>}
                  {item.expectedDate && (
                    <div>
                      Ожидается: {new Date(item.expectedDate).toLocaleDateString("ru-RU")}
                    </div>
                  )}
                  {item.basePrice && (
                    <div>Цена: {formatPrice(item.basePrice)}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className="flex-1 rounded-md border bg-transparent px-2 py-1 text-xs"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {item.notes && (
                  <div className="mt-2 rounded bg-gray-50 p-2 text-xs text-muted-foreground">
                    {item.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
