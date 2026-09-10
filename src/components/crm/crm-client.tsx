"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { BarChart3, LayoutGrid, Table } from "lucide-react";

import { AnalyticsDashboard } from "@/components/crm/analytics-dashboard";
import { DashboardStats } from "@/components/crm/dashboard-stats";
import { FollowUpSettings } from "@/components/crm/follow-up-settings";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { LeadFilters } from "@/components/crm/lead-filters";
import { LeadTable } from "@/components/crm/lead-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heading } from "@/components/ui/section";

interface Manager {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  status: string;
  source: string | null;
  estimatedTotalUsd: string | null;
  createdAt: Date;
  nextFollowUpAt: Date | null;
  lastContactAt: Date | null;
  customerName: string;
  customerPhone: string | null;
  assignedManagerName: string | null;
  brandName: string | null;
  modelName: string | null;
  trimName: string | null;
}

interface DashboardData {
  today: number;
  thisWeek: number;
  overdueFollowUps: number;
  byStatus: { status: string; total: number }[];
  byManager: {
    managerId: string | null;
    managerName: string | null;
    total: number;
  }[];
  topCars: {
    brandName: string | null;
    modelName: string | null;
    total: number;
  }[];
}

interface CrmClientProps {
  managers: Manager[];
  leads: Lead[];
  dashboard: DashboardData;
  currentFilters: {
    status?: string;
    assignedManagerId?: string;
    source?: string;
    search?: string;
  };
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  userRole: string;
}

type ViewMode = "table" | "kanban" | "analytics";

function toIsoString(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function CrmClient({
  managers,
  leads,
  dashboard,
  currentFilters,
  pagination,
}: CrmClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const kanbanLeads = leads.map((lead) => ({
    ...lead,
    statusOrder: 0,
    managerName: lead.assignedManagerName,
    createdAt: toIsoString(lead.createdAt) ?? "",
    lastContactAt: toIsoString(lead.lastContactAt),
    nextFollowUpAt: toIsoString(lead.nextFollowUpAt),
  }));

  const pageHref = (page: number) =>
    `/crm/leads?${new URLSearchParams({
      ...(currentFilters as Record<string, string>),
      page: String(page),
    }).toString()}`;

  return (
    <Tabs
      value={viewMode}
      onValueChange={(value) => setViewMode(value as ViewMode)}
      className="gap-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading size="md">Заявки</Heading>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Всего {pagination.total} · управление статусами и менеджерами
          </p>
        </div>
        <TabsList>
          <TabsTrigger value="table">
            <Table data-icon="inline-start" />
            Таблица
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <LayoutGrid data-icon="inline-start" />
            Канбан
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 data-icon="inline-start" />
            Аналитика
          </TabsTrigger>
        </TabsList>
      </div>

      {viewMode !== "analytics" && (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <DashboardStats data={dashboard} />
            </div>
            <FollowUpSettings />
          </div>

          <Suspense fallback={<Skeleton className="h-16 w-full rounded-xl" />}>
            <LeadFilters managers={managers} currentFilters={currentFilters} />
          </Suspense>
        </>
      )}

      <TabsContent value="table" className="flex flex-col gap-4">
        <LeadTable leads={leads} />

        {pagination.totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Страница {pagination.page} из {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              {pagination.page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={pageHref(pagination.page - 1)} />}
                >
                  Назад
                </Button>
              )}
              {pagination.page < pagination.totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={pageHref(pagination.page + 1)} />}
                >
                  Далее
                </Button>
              )}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="kanban">
        <KanbanBoard leads={kanbanLeads} />
      </TabsContent>

      <TabsContent value="analytics">
        <AnalyticsDashboard />
      </TabsContent>
    </Tabs>
  );
}
