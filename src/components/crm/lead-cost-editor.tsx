"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

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

interface OptionWithPrice {
  name: string;
  priceDelta: number;
  priceKnown: boolean;
  groupType: string;
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
  existingCarOptions?: AdditionalCost[];
  configOptionsTotal?: number;
  optionsWithPrices?: OptionWithPrice[];
  sourceCountry?: string;
  condition?: string;
  trimId?: string;
}

const GROUP_LABELS: Record<string, string> = {
  exterior_color: "Кузов",
  interior_color: "Салон",
  wheels: "Колёса",
  package: "Пакет",
  standalone_option: "Опция",
};

function groupLabel(groupType: string): string {
  return GROUP_LABELS[groupType] || groupType;
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
  existingCarOptions = [],
  optionsWithPrices = [],
  sourceCountry = "Китай",
  condition = "new",
  trimId,
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

  const [optionPrices, setOptionPrices] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    optionsWithPrices.forEach((opt, i) => {
      initial[i] = opt.priceDelta;
    });
    return initial;
  });

  const [carOptions, setCarOptions] = useState<AdditionalCost[]>(existingCarOptions);
  const [carOptionLabel, setCarOptionLabel] = useState("");
  const [carOptionAmount, setCarOptionAmount] = useState("");

  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>(existingAdditionalCosts);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const pricedOptionsTotal = Object.values(optionPrices).reduce((sum, v) => sum + v, 0);
  const carOptionsTotal = carOptions.reduce((sum, c) => sum + c.amount, 0);
  const extras = additionalCosts.reduce((sum, c) => sum + c.amount, 0);

  const total =
    fields.vehiclePrice +
    pricedOptionsTotal +
    carOptionsTotal +
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

  function updateOptionPrice(index: number, value: string) {
    setOptionPrices((prev) => ({ ...prev, [index]: Number(value) || 0 }));
  }

  function addCarOption() {
    if (!carOptionLabel.trim() || !carOptionAmount) return;
    setCarOptions((prev) => [...prev, { label: carOptionLabel.trim(), amount: Number(carOptionAmount) }]);
    setCarOptionLabel("");
    setCarOptionAmount("");
  }

  function removeCarOption(index: number) {
    setCarOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCarOption(index: number, field: "label" | "amount", value: string) {
    setCarOptions((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, [field]: field === "amount" ? Number(value) || 0 : value } : c
      )
    );
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

  async function recalculate() {
    if (!trimId) return;
    setRecalculating(true);
    try {
      const purchasePrice = fields.vehiclePrice + pricedOptionsTotal + carOptionsTotal;
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCountry, condition, purchasePrice, currency: "USD", trimId }),
      });
      if (res.ok) {
        const data = await res.json();
        const b = data.breakdown;
        if (b) {
          setFields((prev) => ({
            ...prev,
            logistics: b.logistics,
            customsDuty: b.customsDuty,
            exciseTax: b.exciseTax,
            vat: b.vat,
            certificationFees: b.certificationFees,
            serviceFee: b.serviceFee,
          }));
          toast.success("Расчёт обновлён");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Расчёт недоступен для этой комбинации");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setRecalculating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const savedOptionsWithPrices = optionsWithPrices.map((opt, i) => ({
        ...opt,
        priceDelta: optionPrices[i] ?? opt.priceDelta,
      }));

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedTotal: total,
          additionalCosts,
          calculatorBreakdown: fields,
          optionsWithPrices: savedOptionsWithPrices,
          carOptions,
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
    <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <DollarSign className="size-3.5" aria-hidden />
        Расчёт стоимости
      </p>

      {/* Автомобиль и комплектация */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase">Автомобиль и комплектация</p>
        <EditableRow label="Цена автомобиля" value={fields.vehiclePrice} onChange={(v) => updateField("vehiclePrice", v)} />
        {optionsWithPrices.map((opt, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="min-w-[180px] text-sm text-muted-foreground">
              {groupLabel(opt.groupType)}: {opt.name}
            </span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={optionPrices[i] || ""}
                onChange={(e) => updateOptionPrice(i, e.target.value)}
                placeholder={opt.priceKnown ? "0" : "цена уточняется"}
                className="h-8 pl-6 text-sm"
              />
            </div>
          </div>
        ))}

        {carOptions.map((cost, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={cost.label} onChange={(e) => updateCarOption(i, "label", e.target.value)} className="flex-1" placeholder="Название" />
            <Input type="number" value={cost.amount || ""} onChange={(e) => updateCarOption(i, "amount", e.target.value)} className="w-32" placeholder="0" />
            <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeCarOption(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}

        <div className="flex items-end gap-2">
          <Input value={carOptionLabel} onChange={(e) => setCarOptionLabel(e.target.value)} placeholder="Доп. опция..." className="h-8 flex-1 text-sm" />
          <Input type="number" value={carOptionAmount} onChange={(e) => setCarOptionAmount(e.target.value)} placeholder="0" className="h-8 w-32 text-sm" />
          <Button variant="outline" size="icon" className="size-8 shrink-0" onClick={addCarOption} disabled={!carOptionLabel.trim() || !carOptionAmount}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Налоги и сборы */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase">Налоги и сборы</p>
          {trimId && (
            <Button variant="outline" size="sm" onClick={recalculate} disabled={recalculating} className="h-7 gap-1 text-xs">
              <RefreshCw className={cn("size-3.5", recalculating && "animate-spin")} />
              Пересчитать
            </Button>
          )}
        </div>
        <EditableRow label="Логистика" value={fields.logistics} onChange={(v) => updateField("logistics", v)} />
        <EditableRow label="Таможенная пошлина" value={fields.customsDuty} onChange={(v) => updateField("customsDuty", v)} />
        <EditableRow label="Акцизный налог" value={fields.exciseTax} onChange={(v) => updateField("exciseTax", v)} />
        <EditableRow label="НДС" value={fields.vat} onChange={(v) => updateField("vat", v)} />
        <EditableRow label="Сертификация / оформление" value={fields.certificationFees} onChange={(v) => updateField("certificationFees", v)} />
        <EditableRow label="Сервисный сбор" value={fields.serviceFee} onChange={(v) => updateField("serviceFee", v)} />
      </div>

      {/* Additional costs */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase">Дополнительные расходы</Label>
        {additionalCosts.map((cost, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={cost.label} onChange={(e) => updateAdditionalCost(i, "label", e.target.value)} className="flex-1" placeholder="Название" />
              <Input type="number" value={cost.amount || ""} onChange={(e) => updateAdditionalCost(i, "amount", e.target.value)} className="w-32" placeholder="0" />
              <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeCost(i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        {additionalCosts.length === 0 && (
          <p className="text-xs text-muted-foreground">Добавьте расходы вручную — перевозка, страховка, хранение и т.д.</p>
        )}
      </div>

      {/* Add new cost */}
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Название</Label>
          <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Цвет, колёса, пакет..." />
        </div>
        <div className="flex w-32 flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Сумма ($)</Label>
          <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="0" />
        </div>
        <Button variant="outline" size="icon" className="size-9 shrink-0" onClick={addCost} disabled={!newLabel.trim() || !newAmount}>
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Total */}
      <Separator />
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Итого</span>
        <span className="text-lg font-semibold text-brand">{formatUsd(total)}</span>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? (
          "Сохранение..."
        ) : saved ? (
          <span className="inline-flex items-center gap-2">
            <Save className="size-4" />
            Сохранено
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Save className="size-4" />
            Сохранить расчёт
          </span>
        )}
      </Button>
    </div>
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
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input
          type="number"
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 pl-6 text-sm"
        />
      </div>
    </div>
  );
}
