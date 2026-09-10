import { Suspense } from "react";
import { redirect } from "next/navigation";

import { CrmClient } from "@/components/crm/crm-client";
import { auth } from "@/lib/auth";
import { getAllManagers, getDashboardStats, getLeads } from "@/lib/crm";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams?: Promise<{
    status?: string;
    assignedManagerId?: string;
    source?: string;
    search?: string;
    page?: string;
  }>;
}

async function LeadsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role?: string };
  const page = Math.max(1, Number(params?.page) || 1);
  const PAGE_SIZE = 20;

  const filters = {
    status: params?.status || undefined,
    assignedManagerId: params?.assignedManagerId || undefined,
    source: params?.source || undefined,
    search: params?.search || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const [result, managers, dashboard] = await Promise.all([
    getLeads(filters),
    getAllManagers(),
    getDashboardStats(),
  ]);

  const total = result.total;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <CrmClient
      managers={managers}
      leads={result.leads}
      dashboard={dashboard}
      currentFilters={filters}
      pagination={{ page, totalPages, total }}
      userRole={user.role ?? "viewer"}
    />
  );
}

export default function LeadsPage({ searchParams }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <LeadsContent searchParams={searchParams} />
    </Suspense>
  );
}
