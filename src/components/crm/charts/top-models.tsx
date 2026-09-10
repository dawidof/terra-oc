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
  CHART_BRAND,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_AXIS_TICK,
} from "@/lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopModelsProps {
  data: { brandName: string | null; modelName: string | null; total: number }[];
}

export function TopModels({ data }: TopModelsProps) {
  const formattedData = data
    .filter((item) => item.brandName && item.modelName)
    .map((item) => ({
      name: `${item.brandName} ${item.modelName}`,
      count: item.total,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Популярные модели</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis type="number" tick={CHART_AXIS_TICK} />
              <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} width={150} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value) => [
                  Number(value ?? 0).toLocaleString("ru-RU"),
                  "Заявки",
                ]}
              />
              <Bar dataKey="count" fill={CHART_BRAND} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
