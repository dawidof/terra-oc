import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getDashboardStats, getLeads } from "@/lib/crm";
import { StatusBadge } from "@/components/crm/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "CRM — Дашборд",
};

export default async function CrmPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; role?: string };
  const [stats, recentLeads] = await Promise.all([
    getDashboardStats(user.id, user.role),
    getLeads({ pageSize: 10 }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            TerraAuto
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">CRM — Дашборд</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Сегодня
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground">заявок</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                За неделю
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground">заявок</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ожидают звонка
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.overdueFollowUps}</div>
              <p className="text-xs text-muted-foreground">просрочено</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Всего заявок
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.byStatus.reduce((sum, s) => sum + s.total, 0)}
              </div>
              <p className="text-xs text-muted-foreground">в системе</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* By Status */}
          <Card>
            <CardHeader>
              <CardTitle>По статусам</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {stats.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between">
                      <StatusBadge status={s.status} />
                      <span className="text-sm font-medium">{s.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Manager */}
          <Card>
            <CardHeader>
              <CardTitle>По менеджерам</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byManager.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет данных</p>
              ) : (
                <div className="space-y-2">
                  {stats.byManager.map((m) => (
                    <div key={m.managerId || "unassigned"} className="flex items-center justify-between">
                      <span className="text-sm">{m.managerName || "Не назначен"}</span>
                      <span className="text-sm font-medium">{m.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Leads */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Последние заявки</CardTitle>
            <Link href="/crm/leads">
              <Button variant="ghost" size="sm">
                Все заявки <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Заявок пока нет</p>
            ) : (
              <div className="space-y-2">
                {recentLeads.leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/crm/leads/${lead.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {lead.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lead.brandName} {lead.modelName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={lead.status} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
