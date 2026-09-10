"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ComparisonData {
  current: {
    totalLeads: number;
    conversionRate: number;
    avgDealSize: number;
    wonLeads: number;
  };
  previous: {
    totalLeads: number;
    conversionRate: number;
    avgDealSize: number;
    wonLeads: number;
  };
}

function getChangeIcon(current: number, previous: number) {
  if (current > previous) return TrendingUp;
  if (current < previous) return TrendingDown;
  return Minus;
}

function getChangeColor(current: number, previous: number) {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-600";
  return "text-muted-foreground";
}

function formatChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "+∞" : "0%";
  const change = ((current - previous) / previous) * 100;
  if (change > 0) return `+${change.toFixed(0)}%`;
  if (change < 0) return `${change.toFixed(0)}%`;
  return "0%";
}

export function ComparisonChart({ data }: { data: ComparisonData }) {
  const metrics = [
    {
      label: "Заявки",
      current: data.current.totalLeads,
      previous: data.previous.totalLeads,
      format: (v: number) => v.toString(),
    },
    {
      label: "Конверсия",
      current: data.current.conversionRate,
      previous: data.previous.conversionRate,
      format: (v: number) => `${v.toFixed(1)}%`,
    },
    {
      label: "Средний чек",
      current: data.current.avgDealSize,
      previous: data.previous.avgDealSize,
      format: (v: number) => `$${v.toLocaleString("en-US")}`,
    },
    {
      label: "Продажи",
      current: data.current.wonLeads,
      previous: data.previous.wonLeads,
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Сравнение с прошлым периодом</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {metrics.map((metric) => {
            const Icon = getChangeIcon(metric.current, metric.previous);
            const color = getChangeColor(metric.current, metric.previous);
            const change = formatChange(metric.current, metric.previous);

            return (
              <div
                key={metric.label}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {metric.format(metric.current)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-muted-foreground">Прошлый</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {metric.format(metric.previous)}
                  </span>
                </div>
                <div className={cn("flex items-center gap-1 text-sm font-medium", color)}>
                  <Icon className="size-3.5" />
                  {change}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
