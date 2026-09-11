import { DashboardView } from "@/components/crm/dashboard-view";
import { getFollowUpTasks, getLeads } from "@/lib/crm";

export const metadata = {
  title: "CRM — Дашборд",
};

export default async function CrmPage() {
  const [recentResult, tasks] = await Promise.all([
    getLeads({ pageSize: 8 }),
    getFollowUpTasks(20),
  ]);

  return (
    <DashboardView
      recentLeads={recentResult.leads}
      tasks={tasks}
    />
  );
}
