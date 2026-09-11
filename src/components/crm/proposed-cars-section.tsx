"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUsd } from "@/lib/format";
import { AddCarDialog } from "./add-car-dialog";

interface ProposedCar {
  id: string;
  trimId: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  powertrainType: string | null;
  drivetrain: string | null;
  enginePowerHp: number | null;
  motorPowerKw: number | null;
  rangeKm: number | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
  addedByName: string | null;
}

const STATUS_OPTIONS = [
  { value: "proposed", label: "Предложено" },
  { value: "considered", label: "Рассматривает" },
  { value: "rejected", label: "Отказ" },
  { value: "ordered", label: "Заказано" },
];

const STATUS_STYLES: Record<string, string> = {
  proposed: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
  considered: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
  ordered: "bg-brand-muted text-brand-muted-foreground ring-1 ring-brand/25",
};

function statusLabel(status: string): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

export function ProposedCarsSection({ leadId }: { leadId: string }) {
  const [cars, setCars] = useState<ProposedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const fetchCars = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/proposed-cars`);
      const data = await res.json();
      setCars(data.cars || []);
    } catch {
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/leads/${leadId}/proposed-cars`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch {
      toast.error("Не удалось обновить статус");
    }
  }

  async function saveNotes(id: string) {
    try {
      const res = await fetch(`/api/leads/${leadId}/proposed-cars`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: editNotes }),
      });
      if (!res.ok) throw new Error("Failed");
      setCars((prev) => prev.map((c) => (c.id === id ? { ...c, notes: editNotes || null } : c)));
      setEditingId(null);
      toast.success("Заметка сохранена");
    } catch {
      toast.error("Не удалось сохранить");
    }
  }

  async function removeCar(id: string) {
    try {
      const res = await fetch(`/api/leads/${leadId}/proposed-cars`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed");
      setCars((prev) => prev.filter((c) => c.id !== id));
      toast.success("Автомобиль удалён");
    } catch {
      toast.error("Не удалось удалить");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Предложенные авто {cars.length > 0 && `(${cars.length})`}
        </p>
        <AddCarDialog leadId={leadId} addedTrimIds={cars.map((c) => c.trimId)} onAdded={fetchCars} />
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && cars.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Нет предложенных автомобилей
        </p>
      )}

      {cars.map((car) => (
        <div
          key={car.id}
          className="flex flex-col gap-2.5 rounded-lg border border-border p-3"
        >
          <div className="flex items-start gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {car.imageUrl ? (
                <Image
                  src={car.imageUrl}
                  alt={`${car.brandName} ${car.modelName}`}
                  fill
                  sizes="64px"
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
                {car.modelName}{" "}
                <span className="font-normal text-muted-foreground">{car.trimName}</span>
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {car.powertrainType && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {car.powertrainType}
                  </Badge>
                )}
                {car.estimatedTotalUsd && (
                  <span className="text-xs font-semibold tabular-nums text-brand">
                    {formatUsd(car.estimatedTotalUsd)}
                  </span>
                )}
              </div>
              {car.addedByName && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  добавил {car.addedByName}
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeCar(car.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={car.status}
              onValueChange={(v) => v && updateStatus(car.id, v)}
              items={STATUS_OPTIONS}
            >
              <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge
              variant="secondary"
              className={`text-[10px] font-normal ${STATUS_STYLES[car.status] || ""}`}
            >
              {statusLabel(car.status)}
            </Badge>
          </div>

          {editingId === car.id ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Заметка..."
                rows={2}
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => saveNotes(car.id)}>
                  Сохранить
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setEditingId(car.id); setEditNotes(car.notes || ""); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-3" />
              {car.notes || "Добавить заметку"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
