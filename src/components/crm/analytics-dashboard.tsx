"use client";

import { useState, useEffect } from "react";
import { LeadsTrend } from "./charts/leads-trend";
import { ConversionFunnel } from "./charts/conversion-funnel";
import { TopModels } from "./charts/top-models";
import { SourceBreakdown } from "./charts/source-breakdown";
import { ManagerPerformance } from "./charts/manager-performance";
import { RevenueEstimate } from "./charts/revenue-estimate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, Users, DollarSign, Clock } from "lucide-react";

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

interface AnalyticsDashboardProps {
  dateRange?: string;
}

export function AnalyticsDashboard({ dateRange = "30d" }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState(dateRange);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
        if (res.ok) {
          const analyticsData = await res.json();
          setData(analyticsData);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedRange]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] animate-pulse rounded bg-gray-100" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-muted-foreground">Не удалось загрузить аналитику</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Всего заявок</div>
                <div className="text-2xl font-bold">{data.summary.totalLeads}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Конверсия</div>
                <div className="text-2xl font-bold">{data.summary.conversionRate.toFixed(1)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Средний чек</div>
                <div className="text-2xl font-bold">
                  ${data.summary.avgDealSize.toLocaleString("en-US")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Время ответа</div>
                <div className="text-2xl font-bold">{data.summary.avgResponseTime}ч</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date range selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Период:</span>
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

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <LeadsTrend data={data.leadsTrend} />
        <ConversionFunnel data={data.conversionFunnel} />
        <RevenueEstimate data={data.revenueEstimate} />
        <TopModels data={data.topModels} />
        <SourceBreakdown data={data.sourceBreakdown} />
        <ManagerPerformance data={data.managerPerformance} />
      </div>
    </div>
  );
}
