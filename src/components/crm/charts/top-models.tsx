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
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [value, "Заявки"]}
              />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
