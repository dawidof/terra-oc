"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, X } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

interface VehicleEditorProps {
  trimId: string;
  data: {
    trimName: string;
    trimSlug: string;
    powertrainType: string | null;
    drivetrain: string | null;
    motorPowerKw: number | null;
    rangeKm: number | null;
    acceleration0100: string | null;
    batteryCapacityKwh: string | null;
    basePrice: string | null;
    estimatedTotalUsd: string | null;
    sourcePrice: string | null;
    deliveryDays: number | null;
    active: boolean;
  };
  onUpdate?: () => void;
}

export function VehicleEditor({ trimId, data, onUpdate }: VehicleEditorProps) {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: data.trimName,
    basePrice: data.basePrice || "",
    estimatedTotalUsd: data.estimatedTotalUsd || "",
    sourcePrice: data.sourcePrice || "",
    rangeKm: data.rangeKm?.toString() || "",
    acceleration0100: data.acceleration0100 || "",
    motorPowerKw: data.motorPowerKw?.toString() || "",
    deliveryDays: data.deliveryDays?.toString() || "",
  });
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  async function handleSave() {
    setLoading(true);
    try {
      if (form.name !== data.trimName) {
        await fetch(`/api/admin/vehicles/${trimId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trimField: "name", value: form.name }),
        });
      }
      if (form.rangeKm !== (data.rangeKm?.toString() || "")) {
        await fetch(`/api/admin/vehicles/${trimId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trimField: "rangeKm", value: form.rangeKm ? Number(form.rangeKm) : null }),
        });
      }
      if (form.acceleration0100 !== (data.acceleration0100 || "")) {
        await fetch(`/api/admin/vehicles/${trimId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trimField: "acceleration0100", value: form.acceleration0100 || null }),
        });
      }
      if (form.motorPowerKw !== (data.motorPowerKw?.toString() || "")) {
        await fetch(`/api/admin/vehicles/${trimId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trimField: "motorPowerKw", value: form.motorPowerKw ? Number(form.motorPowerKw) : null }),
        });
      }

      setOpen(false);
      onUpdate?.();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setOpen(true)}>
        <Pencil className="h-3 w-3" />
        Редактировать
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Редактирование комплектации</h3>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Цена ($)</Label>
              <Input
                type="number"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Итого ($)</Label>
              <Input
                type="number"
                value={form.estimatedTotalUsd}
                onChange={(e) => setForm({ ...form, estimatedTotalUsd: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Запас хода (км)</Label>
              <Input
                type="number"
                value={form.rangeKm}
                onChange={(e) => setForm({ ...form, rangeKm: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>0–100 (сек)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.acceleration0100}
                onChange={(e) => setForm({ ...form, acceleration0100: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Мощность (кВт)</Label>
              <Input
                type="number"
                value={form.motorPowerKw}
                onChange={(e) => setForm({ ...form, motorPowerKw: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Доставка (дни)</Label>
              <Input
                type="number"
                value={form.deliveryDays}
                onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
