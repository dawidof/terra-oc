"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

interface AnalyticsData {
  leadsTrend: { date: string; count: number }[];
  conversionFunnel: { status: string; count: number }[];
  topModels: { brandName: string | null; modelName: string | null; total: number }[];
  sourceBreakdown: { source: string | null; total: number }[];
  managerPerformance: { managerId: string | null; managerName: string | null; total: number }[];
  revenueEstimate: { month: string; total: number }[];
  summary: {
    totalLeads: number;
    conversionRate: number;
    avgDealSize: number;
    avgResponseTime: number;
  };
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AnalyticsData | null;
  dateRange: string;
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

function downloadCSV(filename: string, csv: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function leadsTrendToCSV(data: AnalyticsData["leadsTrend"]): string {
  const header = "Дата;Заявки";
  const rows = data.map((r) => {
    const date = new Date(r.date).toLocaleDateString("ru-RU");
    return `${date};${r.count}`;
  });
  return [header, ...rows].join("\n");
}

function conversionFunnelToCSV(data: AnalyticsData["conversionFunnel"]): string {
  const header = "Статус;Количество";
  const rows = data.map(
    (r) => `${STATUS_LABELS[r.status] || r.status};${r.count}`
  );
  return [header, ...rows].join("\n");
}

function topModelsToCSV(data: AnalyticsData["topModels"]): string {
  const header = "Марка;Модель;Заявки";
  const rows = data.map((r) => `${r.brandName};${r.modelName};${r.total}`);
  return [header, ...rows].join("\n");
}

function revenueToCSV(data: AnalyticsData["revenueEstimate"]): string {
  const header = "Месяц;Сумма (USD)";
  const rows = data.map((r) => {
    const month = new Date(r.month).toLocaleDateString("ru-RU", {
      month: "long",
      year: "numeric",
    });
    return `${month};${r.total}`;
  });
  return [header, ...rows].join("\n");
}

function summaryToCSV(summary: AnalyticsData["summary"], range: string): string {
  const rangeLabels: Record<string, string> = {
    "7d": "7 дней",
    "30d": "30 дней",
    "90d": "90 дней",
  };
  return [
    "Показатель;Значение",
    `Период;${rangeLabels[range] || range}`,
    `Всего заявок;${summary.totalLeads}`,
    `Конверсия;${summary.conversionRate.toFixed(1)}%`,
    `Средний чек (USD);${summary.avgDealSize}`,
    `Время ответа (часы);${summary.avgResponseTime}`,
  ].join("\n");
}

export function ExportDialog({
  open,
  onOpenChange,
  data,
  dateRange,
}: ExportDialogProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExport(type: string) {
    if (!data) return;
    setExporting(type);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      let csv = "";
      let filename = "";

      switch (type) {
        case "summary":
          csv = summaryToCSV(data.summary, dateRange);
          filename = `terraauto-summary-${timestamp}.csv`;
          break;
        case "leads-trend":
          csv = leadsTrendToCSV(data.leadsTrend);
          filename = `terraauto-leads-trend-${timestamp}.csv`;
          break;
        case "funnel":
          csv = conversionFunnelToCSV(data.conversionFunnel);
          filename = `terraauto-funnel-${timestamp}.csv`;
          break;
        case "models":
          csv = topModelsToCSV(data.topModels);
          filename = `terraauto-top-models-${timestamp}.csv`;
          break;
        case "revenue":
          csv = revenueToCSV(data.revenueEstimate);
          filename = `terraauto-revenue-${timestamp}.csv`;
          break;
        case "all":
          csv = [
            summaryToCSV(data.summary, dateRange),
            "",
            "=== ЗАЯВКИ ПО ДНЯМ ===",
            leadsTrendToCSV(data.leadsTrend),
            "",
            "=== ВОРОНКА КОНВЕРСИИ ===",
            conversionFunnelToCSV(data.conversionFunnel),
            "",
            "=== ПОПУЛЯРНЫЕ МОДЕЛИ ===",
            topModelsToCSV(data.topModels),
            "",
            "=== ВЫРУЧКА ===",
            revenueToCSV(data.revenueEstimate),
          ].join("\n");
          filename = `terraauto-full-report-${timestamp}.csv`;
          break;
      }

      downloadCSV(filename, csv);
    } finally {
      setExporting(null);
    }
  }

  const exports = [
    { key: "all", label: "Полный отчёт", desc: "Все данные в одном файле" },
    { key: "summary", label: "Сводка", desc: "Ключевые метрики" },
    { key: "leads-trend", label: "Заявки по дням", desc: "Динамика заявок" },
    { key: "funnel", label: "Воронка конверсии", desc: "Распределение по статусам" },
    { key: "models", label: "Популярные модели", desc: "Топ моделей по заявкам" },
    { key: "revenue", label: "Выручка", desc: "Помесячная выручка" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Экспорт данных</SheetTitle>
          <SheetDescription>
            Скачайте данные в формате CSV для анализа
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 px-4">
          {exports.map((exp) => (
            <button
              key={exp.key}
              onClick={() => handleExport(exp.key)}
              disabled={exporting !== null || !data}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                {exporting === exp.key ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{exp.label}</p>
                <p className="text-xs text-muted-foreground">{exp.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>
            Закрыть
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
