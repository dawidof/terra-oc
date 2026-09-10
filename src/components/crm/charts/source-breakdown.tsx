"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import {
  CHART_CATEGORIES,
  CHART_TOOLTIP_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_ITEM_STYLE,
  CHART_LEGEND_STYLE,
} from "@/lib/chart-colors";
import { sourceLabel } from "@/components/crm/lead-source";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SourceBreakdownProps {
  data: { source: string | null; total: number }[];
}

export function SourceBreakdown({ data }: SourceBreakdownProps) {
  const formattedData = data.map((item, index) => ({
    name: sourceLabel(item.source),
    value: item.total,
    fill: CHART_CATEGORIES[index % CHART_CATEGORIES.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Источники заявок</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                itemStyle={CHART_TOOLTIP_ITEM_STYLE}
                formatter={(value) => [
                  Number(value ?? 0).toLocaleString("ru-RU"),
                  "Заявки",
                ]}
              />
              <Legend formatter={(value) => <span style={CHART_LEGEND_STYLE}>{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
