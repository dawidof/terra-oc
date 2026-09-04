"use client";

import { Suspense } from "react";
import { logout } from "@/lib/actions";
import { LeadFilters } from "@/components/crm/lead-filters";
import { LeadTable } from "@/components/crm/lead-table";
import { DashboardStats } from "@/components/crm/dashboard-stats";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  byManager: { managerId: string | null; managerName: string | null; total: number }[];
  topCars: { brandName: string | null; modelName: string | null; total: number }[];
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

export function CrmClient({
  managers,
  leads,
  dashboard,
  currentFilters,
  pagination,
  userRole,
}: CrmClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            TerraAuto
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/cars">
              <Button variant="ghost" size="sm">
                Каталог
              </Button>
            </Link>
            <Link href="/crm">
              <Button variant="outline" size="sm">CRM</Button>
            </Link>
            <Link href="/crm/import">
              <Button variant="ghost" size="sm">Импорт</Button>
            </Link>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">CRM</h1>
          <p className="text-sm text-muted-foreground">
            Управление заявками и клиентами
          </p>
        </div>

        {/* Dashboard */}
        <div className="mb-8">
          <DashboardStats data={dashboard} />
        </div>

        {/* Filters */}
        <div className="mb-4">
          <Suspense fallback={<div>Загрузка фильтров...</div>}>
            <LeadFilters managers={managers} currentFilters={currentFilters} />
          </Suspense>
        </div>

        {/* Lead table */}
        <div className="mb-4">
          <LeadTable leads={leads} />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Всего: {pagination.total} заявок
            </p>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <Link
                  href={`/crm?${new URLSearchParams({
                    ...currentFilters,
                    page: String(pagination.page - 1),
                  }).toString()}`}
                >
                  <Button variant="outline" size="sm">
                    Назад
                  </Button>
                </Link>
              )}
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {pagination.page} / {pagination.totalPages}
              </span>
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/crm?${new URLSearchParams({
                    ...currentFilters,
                    page: String(pagination.page + 1),
                  }).toString()}`}
                >
                  <Button variant="outline" size="sm">
                    Далее
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
