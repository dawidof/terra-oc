import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeads, getDashboardStats, getAllManagers } from "@/lib/crm";
import { CrmClient } from "@/components/crm/crm-client";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export const metadata = {
  title: "CRM — TerraAuto",
};

export default async function CrmPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  const params = await searchParams;

  const filters = {
    status: params.status,
    assignedManagerId: params.assignedManagerId,
    source: params.source,
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    pageSize: 20,
  };

  const [leadsResult, dashboard, managers] = await Promise.all([
    getLeads(filters),
    getDashboardStats(),
    getAllManagers(),
  ]);

  return (
    <CrmClient
      managers={managers}
      leads={leadsResult.leads}
      dashboard={dashboard}
      currentFilters={{
        status: params.status,
        assignedManagerId: params.assignedManagerId,
        source: params.source,
        search: params.search,
      }}
      pagination={{
        page: leadsResult.page,
        totalPages: leadsResult.totalPages,
        total: leadsResult.total,
      }}
      userRole={user.role}
    />
  );
}
