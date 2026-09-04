import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Clock, CheckCircle, XCircle, Car } from "lucide-react";

interface DashboardData {
  today: number;
  thisWeek: number;
  overdueFollowUps: number;
  byStatus: { status: string; total: number }[];
  byManager: { managerId: string | null; managerName: string | null; total: number }[];
  topCars: { brandName: string | null; modelName: string | null; total: number }[];
}

const statusLabels: Record<string, string> = {
  new: "Новые",
  assigned: "Назначены",
  contacted: "Связались",
  needs_follow_up: "Требуют звонка",
  qualified: "Квалифицированы",
  quote_sent: "Предложения",
  negotiation: "Переговоры",
  won: "Продажи",
  lost: "Отказы",
};

export function DashboardStats({ data }: { data: DashboardData }) {
  const wonCount = data.byStatus.find((s) => s.status === "won")?.total || 0;
  const lostCount = data.byStatus.find((s) => s.status === "lost")?.total || 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-lg bg-blue-100 p-3">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.today}</p>
            <p className="text-xs text-muted-foreground">Новых сегодня</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-lg bg-indigo-100 p-3">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.thisWeek}</p>
            <p className="text-xs text-muted-foreground">Новых за неделю</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-lg bg-green-100 p-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{wonCount}</p>
            <p className="text-xs text-muted-foreground">Продаж</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-lg bg-red-100 p-3">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{lostCount}</p>
            <p className="text-xs text-muted-foreground">Отказов</p>
          </div>
        </CardContent>
      </Card>

      {data.overdueFollowUps > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-amber-100 p-3">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{data.overdueFollowUps}</p>
              <p className="text-xs text-amber-600">Просроченных звонков</p>
            </div>
          </CardContent>
        </Card>
      )}

      {data.topCars.length > 0 && (
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Car className="h-4 w-4" />
              Популярные модели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topCars.map((car, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{car.brandName} {car.modelName}</span>
                  <span className="font-medium">{car.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.byManager.filter((m) => m.managerId).length > 0 && (
        <Card className="sm:col-span-2 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              По менеджерам
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.byManager
                .filter((m) => m.managerId)
                .map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{m.managerName || "—"}</span>
                    <span className="font-medium">{m.total}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
