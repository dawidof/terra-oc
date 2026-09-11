"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/crm/status-badge";
import { LeadsTrend } from "@/components/crm/charts/leads-trend";
import { ConversionFunnel } from "@/components/crm/charts/conversion-funnel";
import { TopModels } from "@/components/crm/charts/top-models";
import { SourceBreakdown } from "@/components/crm/charts/source-breakdown";
import { RevenueEstimate } from "@/components/crm/charts/revenue-estimate";
import { formatDate, formatUsd } from "@/lib/format";

interface AnalyticsSummary {
  summary: {
    totalLeads: number;
    conversionRate: number;
    avgDealSize: number;
    avgResponseTime: number;
  };
  leadsTrend: { date: string; count: number }[];
  conversionFunnel: { status: string; count: number }[];
  topModels: { brandName: string | null; modelName: string | null; total: number }[];
  sourceBreakdown: { source: string | null; total: number }[];
  revenueEstimate: { month: string; total: number }[];
  revenuePipeline: {
    status: string;
    label: string;
    count: number;
    totalValue: number;
  }[];
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
}

function dealsPlural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "сделка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "сделки";
  return "сделок";
}

export interface DashboardLead {
  id: string;
  status: string;
  createdAt: Date | string;
  customerName: string;
  brandName: string | null;
  modelName: string | null;
}

export interface DashboardTask {
  id: string;
  nextFollowUpAt: Date | string | null;
  customerName: string;
  customerPhone: string | null;
  assignedManagerName: string | null;
  brandName: string | null;
  modelName: string | null;
}

const ranges = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "90 дней" },
];

export function DashboardView({
  recentLeads,
  tasks,
}: {
  recentLeads: DashboardLead[];
  tasks: DashboardTask[];
}) {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`);
        if (res.ok && !cancelled) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const now = new Date();
  const overdue = tasks.filter(
    (t) =>
      t.nextFollowUpAt !== null &&
      new Date(t.nextFollowUpAt).getTime() < now.getTime()
  );
  const dueToday = tasks.length - overdue.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Дашборд</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Обзор активности и ключевых метрик
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase">
            Период
          </span>
          {ranges.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {loading || !data ? (
        <StatGrid>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </StatGrid>
      ) : (
        <StatGrid>
          <StatCard
            label="Заявки"
            value={data.summary.totalLeads}
            icon={TrendingUp}
            tone="info"
            hint="за выбранный период"
          />
          <StatCard
            label="Конверсия"
            value={`${data.summary.conversionRate.toFixed(1)}%`}
            icon={Users}
            tone="success"
            hint="заявок завершилось продажей"
          />
          <StatCard
            label="Выручка"
            value={formatUsd(
              data.revenuePipeline.find((s) => s.status === "won")?.totalValue ?? 0
            )}
            icon={DollarSign}
            tone="brand"
            hint={`${data.comparison?.current?.wonLeads ?? 0} ${dealsPlural(
              data.comparison?.current?.wonLeads ?? 0
            )} · оценка за период`}
          />
          <StatCard
            label="Задачи"
            value={overdue.length}
            icon={AlertCircle}
            tone={overdue.length > 0 ? "danger" : "default"}
            hint={overdue.length > 0 ? "просрочено" : "всё под контролем"}
          />
        </StatGrid>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading || !data ? (
            <Skeleton className="h-[340px] rounded-xl" />
          ) : (
            <LeadsTrend data={data.leadsTrend} />
          )}
        </div>
        {loading || !data ? (
          <Skeleton className="h-[340px] rounded-xl" />
        ) : (
          <ConversionFunnel data={data.conversionFunnel} />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading || !data ? (
          <>
            <Skeleton className="h-[340px] rounded-xl" />
            <Skeleton className="h-[340px] rounded-xl" />
            <Skeleton className="h-[340px] rounded-xl" />
          </>
        ) : (
          <>
            <SourceBreakdown data={data.sourceBreakdown} />
            <RevenueEstimate data={data.revenueEstimate} />
            <TopModels data={data.topModels} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Звонки на сегодня
            </p>
            <Link
              href="/crm/tasks"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
            >
              Все задачи
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Просрочено: <span className="font-medium text-red-600">{overdue.length}</span> ·
            На сегодня: <span className="font-medium text-amber-600">{dueToday}</span>
          </p>
          {tasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Задач на сегодня нет
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {tasks.slice(0, 6).map((task) => {
                const isOverdue =
                  task.nextFollowUpAt !== null &&
                  new Date(task.nextFollowUpAt).getTime() < now.getTime();
                return (
                  <Link
                    key={task.id}
                    href={`/crm/leads/${task.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {task.customerName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[task.brandName, task.modelName]
                          .filter(Boolean)
                          .join(" ") || "—"}
                      </div>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 text-xs whitespace-nowrap ${
                        isOverdue ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      <CalendarClock className="size-3.5" aria-hidden />
                      {formatDate(task.nextFollowUpAt)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Последние заявки
            </p>
            <Link
              href="/crm/leads"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand transition-colors hover:text-brand/80"
            >
              Все заявки
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Заявок пока нет
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/crm/leads/${lead.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {lead.customerName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[lead.brandName, lead.modelName].filter(Boolean).join(" ") ||
                        "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={lead.status} />
                    <span className="text-xs whitespace-nowrap text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
