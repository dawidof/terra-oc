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

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  assigned: "#6366f1",
  contacted: "#06b6d4",
  needs_follow_up: "#f59e0b",
  qualified: "#8b5cf6",
  quote_sent: "#6366f1",
  negotiation: "#f97316",
  won: "#10b981",
  lost: "#ef4444",
};

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const formattedData = data
    .filter((item) => item.status !== "lost")
    .map((item) => ({
      name: STATUS_LABELS[item.status] || item.status,
      count: item.count,
      fill: STATUS_COLORS[item.status] || "#6b7280",
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Воронка конверсии</CardTitle>
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
                width={120}
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
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
