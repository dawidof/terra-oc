"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Plus, Trash2, Save, CheckCircle } from "lucide-react";

interface CalculatorBreakdown {
  vehiclePrice: number;
  logistics: number;
  customsDuty: number;
  exciseTax: number;
  vat: number;
  certificationFees: number;
  serviceFee: number;
  total: number;
}

interface AdditionalCost {
  label: string;
  amount: number;
}

interface CostEditorProps {
  leadId: string;
  calculatorBreakdown?: CalculatorBreakdown | null;
  fallbackVehiclePrice?: number | null;
  fallbackLogistics?: number | null;
  fallbackCustoms?: number | null;
  fallbackServiceFee?: number | null;
  fallbackTotal?: number | null;
  existingAdditionalCosts?: AdditionalCost[];
  configOptionsTotal?: number;
}

function fmt(amount: number): string {
  return `$${Math.round(amount).toLocaleString("ru-RU")}`;
}

export function LeadCostEditor({
  leadId,
  calculatorBreakdown,
  fallbackVehiclePrice,
  fallbackLogistics,
  fallbackCustoms,
  fallbackServiceFee,
  fallbackTotal,
  existingAdditionalCosts = [],
  configOptionsTotal = 0,
}: CostEditorProps) {
  const [fields, setFields] = useState<CalculatorBreakdown>(() => {
    if (calculatorBreakdown) return calculatorBreakdown;
    return {
      vehiclePrice: fallbackVehiclePrice || 0,
      logistics: fallbackLogistics || 0,
      customsDuty: fallbackCustoms || 0,
      exciseTax: 0,
      vat: 0,
      certificationFees: 0,
      serviceFee: fallbackServiceFee || 0,
      total: fallbackTotal || 0,
    };
  });
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>(existingAdditionalCosts);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const extras = additionalCosts.reduce((sum, c) => sum + c.amount, 0);
  const total =
    fields.vehiclePrice +
    configOptionsTotal +
    fields.logistics +
    fields.customsDuty +
    fields.exciseTax +
    fields.vat +
    fields.certificationFees +
    fields.serviceFee +
    extras;

  function updateField(key: keyof CalculatorBreakdown, value: string) {
    setFields((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  }

  function addCost() {
    if (!newLabel.trim() || !newAmount) return;
    setAdditionalCosts((prev) => [...prev, { label: newLabel.trim(), amount: Number(newAmount) }]);
    setNewLabel("");
    setNewAmount("");
  }

  function removeCost(index: number) {
    setAdditionalCosts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateAdditionalCost(index: number, field: "label" | "amount", value: string) {
    setAdditionalCosts((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: field === "amount" ? Number(value) || 0 : value } : c
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedTotal: total,
          additionalCosts,
          calculatorBreakdown: fields,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4" />
          Расчёт стоимости
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Base costs — editable */}
        <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
          <EditableRow
            label="Цена автомобиля"
            value={fields.vehiclePrice}
            onChange={(v) => updateField("vehiclePrice", v)}
          />
          {configOptionsTotal > 0 && (
            <div className="flex items-center gap-3">
              <span className="min-w-[180px] text-sm text-muted-foreground">
                Опции (цвет, колёса, пакеты)
              </span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="text"
                  value={configOptionsTotal.toLocaleString("ru-RU")}
                  readOnly
                  className="h-8 pl-6 text-sm bg-muted"
                />
              </div>
            </div>
          )}
          <EditableRow
            label="Логистика"
            value={fields.logistics}
            onChange={(v) => updateField("logistics", v)}
          />
          <EditableRow
            label="Таможенная пошлина"
            value={fields.customsDuty}
            onChange={(v) => updateField("customsDuty", v)}
          />
          <EditableRow
            label="Акцизный налог"
            value={fields.exciseTax}
            onChange={(v) => updateField("exciseTax", v)}
          />
          <EditableRow
            label="НДС"
            value={fields.vat}
            onChange={(v) => updateField("vat", v)}
          />
          <EditableRow
            label="Сертификация / оформление"
            value={fields.certificationFees}
            onChange={(v) => updateField("certificationFees", v)}
          />
          <EditableRow
            label="Сервисный сбор"
            value={fields.serviceFee}
            onChange={(v) => updateField("serviceFee", v)}
          />
        </div>

        {/* Additional costs */}
        {additionalCosts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Дополнительные расходы</Label>
            <div className="space-y-2">
              {additionalCosts.map((cost, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={cost.label}
                    onChange={(e) => updateAdditionalCost(i, "label", e.target.value)}
                    className="flex-1"
                    placeholder="Название"
                  />
                  <Input
                    type="number"
                    value={cost.amount || ""}
                    onChange={(e) => updateAdditionalCost(i, "amount", e.target.value)}
                    className="w-32"
                    placeholder="0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCost(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new cost */}
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Название</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Цвет, колёса, пакет..."
            />
          </div>
          <div className="w-32 space-y-1">
            <Label className="text-xs text-muted-foreground">Сумма ($)</Label>
            <Input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={addCost}
            disabled={!newLabel.trim() || !newAmount}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Total */}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Итого</span>
          <span className="text-lg font-bold text-emerald-600">{fmt(total)}</span>
        </div>

        {/* Save */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? (
            "Сохранение..."
          ) : saved ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Сохранено
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Сохранить расчёт
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function EditableRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-[180px] text-sm text-muted-foreground">{label}</span>
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 pl-6 text-sm"
        />
      </div>
    </div>
  );
}
