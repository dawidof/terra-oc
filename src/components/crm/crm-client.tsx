"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, Download, LayoutGrid, Loader2, Table, X } from "lucide-react";

import { AnalyticsDashboard } from "@/components/crm/analytics-dashboard";
import { DashboardStats } from "@/components/crm/dashboard-stats";
import { FollowUpSettings } from "@/components/crm/follow-up-settings";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { LeadFilters } from "@/components/crm/lead-filters";
import { LeadTable } from "@/components/crm/lead-table";
import { NewLeadSheet } from "@/components/crm/new-lead-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusOptions } from "@/components/crm/status-badge";

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

interface CurrentFilters {
  status?: string;
  assignedManagerId?: string;
  source?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  budgetMin?: number;
  budgetMax?: number;
}

interface CrmClientProps {
  managers: Manager[];
  leads: Lead[];
  dashboard: DashboardData;
  currentFilters: CurrentFilters;
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
  userRole,
}: CrmClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("none");
  const [bulkManager, setBulkManager] = useState("none");
  const [bulkApplying, setBulkApplying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isAdmin = userRole === "admin";
  const statusOptions = getStatusOptions();

  const kanbanLeads = leads.map((lead) => ({
    ...lead,
    statusOrder: 0,
    managerName: lead.assignedManagerName,
    createdAt: toIsoString(lead.createdAt) ?? "",
    lastContactAt: toIsoString(lead.lastContactAt),
    nextFollowUpAt: toIsoString(lead.nextFollowUpAt),
  }));

  const filterSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(currentFilters)) {
    if (value !== undefined && value !== null && key !== "page" && key !== "pageSize") {
      filterSearchParams.set(key, String(value));
    }
  }

  const pageHref = (page: number) => {
    const params = new URLSearchParams(filterSearchParams);
    params.set("page", String(page));
    return `/crm/leads?${params.toString()}`;
  };

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? leads.map((lead) => lead.id) : []);
  }

  async function applyBulk() {
    if (selectedIds.length === 0) return;
    const body: Record<string, unknown> = { ids: selectedIds };
    if (bulkStatus !== "none") body.status = bulkStatus;
    if (bulkManager !== "none") body.assignedManagerId = bulkManager;

    if (!("status" in body) && !("assignedManagerId" in body)) {
      toast.error("Выберите статус или менеджера");
      return;
    }

    setBulkApplying(true);
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось обновить заявки");
      toast.success(`Обновлено заявок: ${data.updated}`);
      setSelectedIds([]);
      setBulkStatus("none");
      setBulkManager("none");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setBulkApplying(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const params = new URLSearchParams(filterSearchParams);
      params.set("pageSize", "10000");
      const res = await fetch(`/api/leads/export?${params.toString()}`);
      if (!res.ok) throw new Error("Не удалось экспортировать заявки");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `terraauto-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Заявки экспортированы");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Tabs
      value={viewMode}
      onValueChange={(value) => setViewMode(value as ViewMode)}
      className="gap-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Заявки</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Всего {pagination.total} · управление статусами и менеджерами
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewLeadSheet />
          {viewMode === "table" && (
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              {exporting ? (
                <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
              ) : (
                <Download data-icon="inline-start" className="size-3.5" />
              )}
              Экспорт
            </Button>
          )}
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
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 ring-1 ring-brand/30">
            <span className="text-sm font-medium">
              Выбрано: {selectedIds.length}
            </span>
            <Select
              value={bulkStatus}
              onValueChange={(v) => setBulkStatus(v || "none")}
              items={[{ value: "none", label: "Статус не менять" }, ...statusOptions]}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Статус не менять" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" label="Статус не менять">
                  Статус не менять
                </SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select
                value={bulkManager}
                onValueChange={(v) => setBulkManager(v || "none")}
                items={[
                  { value: "none", label: "Менеджер не менять" },
                  ...managers.map((m) => ({ value: m.id, label: m.name })),
                ]}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Менеджер не менять" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" label="Менеджер не менять">
                    Менеджер не менять
                  </SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id} label={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button size="sm" onClick={applyBulk} disabled={bulkApplying}>
              {bulkApplying && <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />}
              Применить
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              <X data-icon="inline-start" className="size-3.5" />
              Снять выделение
            </Button>
          </div>
        )}

        <LeadTable
          leads={leads}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />

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
                  nativeButton={false}
                >
                  Назад
                </Button>
              )}
              {pagination.page < pagination.totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={pageHref(pagination.page + 1)} />}
                  nativeButton={false}
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
