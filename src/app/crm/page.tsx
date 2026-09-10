import Link from "next/link";
import { ArrowRight, TrendingUp, Users, Clock } from "lucide-react";

import { StatusBadge } from "@/components/crm/status-badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Heading } from "@/components/ui/section";
import { getDashboardStats, getLeads } from "@/lib/crm";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "CRM — Дашборд",
};

export default async function CrmPage() {
  const [stats, recentLeads] = await Promise.all([
    getDashboardStats(),
    getLeads({ pageSize: 10 }),
  ]);

  const totalByStatus = stats.byStatus.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Heading size="md">CRM — Дашборд</Heading>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Обзор активности и ключевых метрик
        </p>
      </div>

      <StatGrid>
        <StatCard label="Сегодня" value={stats.today} icon={Users} tone="info" hint="заявок" />
        <StatCard label="За неделю" value={stats.thisWeek} icon={TrendingUp} hint="заявок" />
        <StatCard
          label="Ожидают звонка"
          value={stats.overdueFollowUps}
          icon={Clock}
          tone="warning"
          hint="просрочено"
        />
        <StatCard label="Всего заявок" value={totalByStatus} icon={Users} hint="в системе" />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Status */}
        <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            По статусам
          </p>
          {stats.byStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.byStatus.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <StatusBadge status={s.status} />
                  <span className="tabular-nums text-sm font-medium">{s.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Manager */}
        <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            По менеджерам
          </p>
          {stats.byManager.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет данных</p>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.byManager.map((m) => (
                <div
                  key={m.managerId || "unassigned"}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm">{m.managerName || "Не назначен"}</span>
                  <span className="tabular-nums text-sm font-medium">{m.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Leads */}
      <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
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

        {recentLeads.leads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Заявок пока нет</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recentLeads.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/crm/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{lead.customerName}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {lead.brandName} {lead.modelName}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={lead.status} />
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
