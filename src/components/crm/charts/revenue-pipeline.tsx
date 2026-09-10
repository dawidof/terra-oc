"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  CHART_CATEGORIES,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_AXIS_TICK,
} from "@/lib/chart-colors";
import { formatUsd } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenuePipelineProps {
  data: {
    status: string;
    label: string;
    count: number;
    totalValue: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  qualified: "var(--chart-3)",
  quote_sent: "var(--chart-2)",
  negotiation: "var(--chart-4)",
  won: "var(--chart-1)",
};

export function RevenuePipeline({ data }: RevenuePipelineProps) {
  const formattedData = data.map((item) => ({
    name: item.label,
    count: item.count,
    value: item.totalValue,
    fill: STATUS_COLORS[item.status] || "var(--chart-1)",
  }));

  const totalPipeline = data.reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Пайплайн выручки</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{formatUsd(totalPipeline)}</span>
          <span className="text-xs text-muted-foreground">ожидаемая выручка</span>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="name" tick={CHART_AXIS_TICK} />
              <YAxis
                tick={CHART_AXIS_TICK}
                tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value) => {
                  const numValue = Array.isArray(value) ? Number(value[0]) : Number(value);
                  return [formatUsd(numValue), "Сумма"];
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <rect key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] }}
              />
              <span>
                {item.label}: {item.count} · {formatUsd(item.totalValue)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
