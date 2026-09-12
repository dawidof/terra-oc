"use client";

import { useState, useEffect } from "react";
import { Clock, DollarSign, Download, TrendingUp, Users } from "lucide-react";

import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { formatUsd } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportDialog } from "@/components/crm/export-dialog";
import { LeadsTrend } from "./charts/leads-trend";
import { ConversionFunnel } from "./charts/conversion-funnel";
import { TopModels } from "./charts/top-models";
import { SourceBreakdown } from "./charts/source-breakdown";
import { ManagerPerformance } from "./charts/manager-performance";
import { RevenueEstimate } from "./charts/revenue-estimate";
import { RevenuePipeline } from "./charts/revenue-pipeline";
import { ComparisonChart } from "./charts/comparison-chart";
import { UtmSourcesChart } from "./charts/utm-sources-chart";
import { UtmTablesCard } from "./charts/utm-tables-card";

interface UtmRow {
  name: string;
  total: number;
  won: number;
  revenue: number;
}

interface AnalyticsData {
  leadsTrend: { date: string; count: number }[];
  conversionFunnel: { status: string; count: number }[];
  topModels: { brandName: string | null; modelName: string | null; total: number }[];
  sourceBreakdown: { source: string | null; total: number }[];
  managerPerformance: { managerId: string | null; managerName: string | null; total: number }[];
  revenueEstimate: { month: string; total: number }[];
  revenuePipeline: {
    status: string;
    label: string;
    count: number;
    totalValue: number;
  }[];
  utmAnalytics?: {
    sources: UtmRow[];
    campaigns: UtmRow[];
    referrerHosts: UtmRow[];
  };
  comparison: {
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
  };
  summary: {
    totalLeads: number;
    conversionRate: number;
    avgDealSize: number;
    avgResponseTime: number;
  };
}

interface AnalyticsDashboardProps {
  dateRange?: string;
}

function dealsPlural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "сделка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сделки";
  return "сделок";
}

export function AnalyticsDashboard({ dateRange = "30d" }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(dateRange);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
        if (res.ok && !cancelled) {
          const analyticsData = await res.json();
          setData(analyticsData);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [selectedRange]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <StatGrid>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </StatGrid>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[340px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Не удалось загрузить аналитику</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StatGrid>
        <StatCard label="Всего заявок" value={data.summary.totalLeads} icon={TrendingUp} tone="info" />
        <StatCard label="Конверсия" value={`${data.summary.conversionRate.toFixed(1)}%`} icon={Users} tone="success" />
        <StatCard
          label="Выручка"
          value={formatUsd(
            data.revenuePipeline?.find((s) => s.status === "won")?.totalValue ?? 0
          )}
          icon={DollarSign}
          tone="brand"
          hint={`${
            data.comparison?.current?.wonLeads ?? 0
          } ${dealsPlural(data.comparison?.current?.wonLeads ?? 0)} · оценка за период`}
        />
        <StatCard label="Время ответа" value={`${data.summary.avgResponseTime}ч`} icon={Clock} tone="warning" />
      </StatGrid>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">Период</span>
          {[
            { value: "7d", label: "7 дней" },
            { value: "30d", label: "30 дней" },
            { value: "90d", label: "90 дней" },
          ].map((range) => (
            <Button
              key={range.value}
              variant={selectedRange === range.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range.value)}
            >
              {range.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
          <Download data-icon="inline-start" className="size-3.5" />
          Экспорт
        </Button>
      </div>

      {/* New: Comparison + Pipeline row */}
      <div className="grid gap-6 md:grid-cols-2">
        {data.comparison && <ComparisonChart data={data.comparison} />}
        {data.revenuePipeline && data.revenuePipeline.length > 0 && (
          <RevenuePipeline data={data.revenuePipeline} />
        )}
      </div>

      {/* Existing charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <LeadsTrend data={data.leadsTrend} />
        <ConversionFunnel data={data.conversionFunnel} />
        <RevenueEstimate data={data.revenueEstimate} />
        <TopModels data={data.topModels} />
        <SourceBreakdown data={data.sourceBreakdown} />
        <ManagerPerformance data={data.managerPerformance} />
        {data.utmAnalytics && data.utmAnalytics.sources.length > 0 && (
          <UtmSourcesChart data={data.utmAnalytics.sources} />
        )}
        {data.utmAnalytics && (
          <UtmTablesCard
            campaigns={data.utmAnalytics.campaigns}
            referrerHosts={data.utmAnalytics.referrerHosts}
          />
        )}
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        data={data}
        dateRange={selectedRange}
      />
    </div>
  );
}
