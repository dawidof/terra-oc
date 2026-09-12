"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  CHART_BRAND,
  CHART_NEUTRAL,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_AXIS_TICK,
  CHART_LEGEND_STYLE,
} from "@/lib/chart-colors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UtmRow {
  name: string;
  total: number;
  won: number;
  revenue: number;
}

interface UtmSourcesChartProps {
  data: UtmRow[];
}

export function UtmSourcesChart({ data }: UtmSourcesChartProps) {
  const formattedData = data.map((item) => ({
    name: item.name,
    total: item.total,
    won: item.won,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Каналы трафика (UTM)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} />
              <XAxis dataKey="name" tick={CHART_AXIS_TICK} />
              <YAxis tick={CHART_AXIS_TICK} allowDecimals={false} />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value, key) => [
                  Number(value ?? 0).toLocaleString("ru-RU"),
                  key === "total" ? "Заявки" : "Продажи",
                ]}
              />
              <Legend formatter={(value) => <span style={CHART_LEGEND_STYLE}>{value === "total" ? "Заявки" : "Продажи"}</span>} />
              <Bar dataKey="total" name="total" fill={CHART_NEUTRAL} radius={[4, 4, 0, 0]} />
              <Bar dataKey="won" name="won" fill={CHART_BRAND} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
