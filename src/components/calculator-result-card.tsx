"use client";

import { Check, Link2 } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/price-breakdown";
import { cn } from "@/lib/utils";

export interface CalculationResult {
  vehiclePrice: number;
  logistics: number;
  customsDuty: number;
  exciseTax: number;
  vat: number;
  certificationFees: number;
  serviceFee: number;
  total: number;
  exchangeRate: number;
  formulaVersion: string;
}

interface CostItem {
  label: string;
  amount: number;
}

interface CalculatorResultCardProps {
  result: CalculationResult;
  refreshing: boolean;
  uzsRate: number;
  rateSource: string | null;
  shareCopied: boolean;
  onCopyShare: () => void;
}

export function CalculatorResultCard({
  result,
  refreshing,
  uzsRate,
  rateSource,
  shareCopied,
  onCopyShare,
}: CalculatorResultCardProps) {
  const items: CostItem[] = [
    { label: "Стоимость автомобиля", amount: result.vehiclePrice },
    { label: "Логистика", amount: result.logistics },
    { label: "Таможенные платежи", amount: result.customsDuty },
    { label: "Акцизный налог", amount: result.exciseTax },
    { label: "НДС", amount: result.vat },
    { label: "Сертификация / оформление", amount: result.certificationFees },
    { label: "Услуги компании", amount: result.serviceFee },
  ].filter((item) => item.amount > 0);

  const total = result.total > 0 ? result.total : 1;

  return (
    <Card aria-busy={refreshing}>
      <CardHeader>
        <CardTitle>Ориентировочная стоимость под ключ</CardTitle>
        <CardAction>
          <button
            type="button"
            onClick={onCopyShare}
            title="Скопировать ссылку на расчёт"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {shareCopied ? (
              <Check className="h-4 w-4 text-brand" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            <span className="sr-only">Скопировать ссылку на расчёт</span>
          </button>
        </CardAction>
      </CardHeader>
      <CardContent
        className={cn(
          "space-y-4 transition-opacity duration-200",
          refreshing && "pointer-events-none opacity-50"
        )}
      >
        <div className="rounded-xl bg-brand-muted px-4 py-3.5">
          <p className="text-sm text-brand-muted-foreground">Итого ориентировочно</p>
          <p className="mt-0.5 text-3xl font-bold tracking-[-0.02em] tabular-nums text-foreground">
            {formatUsd(Math.round(result.total))}
          </p>
          {uzsRate > 0 && (
            <p className="mt-1 text-sm tabular-nums text-brand-muted-foreground">
              ≈ {Math.round(result.total * uzsRate).toLocaleString("uz-UZ")} UZS
            </p>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium tabular-nums">
                  {formatUsd(Math.round(item.amount))}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand/60 transition-[width] duration-500"
                  style={{ width: `${Math.max((item.amount / total) * 100, 0.5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {uzsRate > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="tabular-nums">
              Курс: 1 USD = {uzsRate.toLocaleString("uz-UZ")} UZS
            </span>
            {rateSource && (
              <span className="text-muted-foreground/60">({rateSource})</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
