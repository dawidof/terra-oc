"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  CHART_CATEGORIES,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_AXIS_TICK,
} from "@/lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConversionFunnelProps {
  data: { status: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новые",
  assigned: "Назначены",
  contacted: "Связались",
  needs_follow_up: "Follow-up",
  qualified: "Квалифицированы",
  quote_sent: "Расчёт отправлен",
  negotiation: "Переговоры",
  won: "Выиграны",
  lost: "Проиграны",
};

const STATUS_ORDER = [
  "new",
  "assigned",
  "contacted",
  "needs_follow_up",
  "qualified",
  "quote_sent",
  "negotiation",
  "won",
  "lost",
] as const;

const STATUS_COLOR_MAP: Record<string, string> = Object.fromEntries(
  STATUS_ORDER.map((key, i) => [key, CHART_CATEGORIES[i % CHART_CATEGORIES.length]])
);

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const ordered = [...data]
    .sort((a, b) => STATUS_ORDER.indexOf(a.status as typeof STATUS_ORDER[number]) - STATUS_ORDER.indexOf(b.status as typeof STATUS_ORDER[number]))
    .filter((item) => item.status !== "lost")
    .map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      count: item.count,
      status: item.status,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Воронка конверсии</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ordered} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis type="number" tick={CHART_AXIS_TICK} />
              <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} width={120} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value) => [
                  Number(value ?? 0).toLocaleString("ru-RU"),
                  "Заявки",
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {ordered.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLOR_MAP[entry.status] ?? CHART_CATEGORIES[index % CHART_CATEGORIES.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
