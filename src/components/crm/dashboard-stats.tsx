import { Car, Clock, TrendingUp, Users, XCircle } from "lucide-react";

import { StatCard, StatGrid } from "@/components/ui/stat-card";

interface DashboardData {
  today: number;
  thisWeek: number;
  overdueFollowUps: number;
  byStatus: { status: string; total: number }[];
  byManager: { managerId: string | null; managerName: string | null; total: number }[];
  topCars: { brandName: string | null; modelName: string | null; total: number }[];
}

export function DashboardStats({ data }: { data: DashboardData }) {
  const wonCount = data.byStatus.find((s) => s.status === "won")?.total || 0;
  const lostCount = data.byStatus.find((s) => s.status === "lost")?.total || 0;

  const byManager = data.byManager.filter((m) => m.managerId);
  const topCars = data.topCars.filter((c) => c.brandName && c.modelName);

  return (
    <div className="flex flex-col gap-5">
      <StatGrid>
        <StatCard label="Сегодня" value={data.today} icon={Users} tone="info" hint="новых заявок" />
        <StatCard label="За неделю" value={data.thisWeek} icon={TrendingUp} hint="новых заявок" />
        <StatCard label="Продажи" value={wonCount} icon={Car} tone="success" />
        <StatCard label="Отказы" value={lostCount} icon={XCircle} tone="danger" />
        {data.overdueFollowUps > 0 && (
          <StatCard
            label="Просрочено"
            value={data.overdueFollowUps}
            icon={Clock}
            tone="warning"
            hint="нужен follow-up"
          />
        )}
      </StatGrid>

      <div className="grid gap-4 md:grid-cols-2">
        {topCars.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Популярные модели
            </p>
            <div className="space-y-2">
              {topCars.map((car, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">
                    {car.brandName} {car.modelName}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{car.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {byManager.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              По менеджерам
            </p>
            <div className="space-y-2">
              {byManager.map((m, i) => (
                <div key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{m.managerName || "—"}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{m.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
