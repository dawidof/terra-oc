import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLeadById, getAllManagers } from "@/lib/crm";
import { StatusBadge, getStatusOptions } from "@/components/crm/status-badge";
import { LeadTimeline } from "@/components/crm/lead-timeline";
import { LeadNotes } from "@/components/crm/lead-notes";
import { LeadDetailActions } from "@/components/crm/lead-detail-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  MapPin,
  Car,
  Package,
  DollarSign,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Заявка — TerraAuto CRM",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: string | null): string {
  if (!price) return "—";
  return `$${Number(price).toLocaleString("en-US")}`;
}

export default async function LeadDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const managers = await getAllManagers();
  const user = session.user as any;
  const statusOptions = getStatusOptions();

  const config = lead.configuration;
  const configJson = config?.configurationJson as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            TerraAuto
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/crm">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                CRM
              </Button>
            </Link>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{lead.customerName}</h1>
            <p className="text-sm text-muted-foreground">
              Заявка #{lead.id.slice(0, 8)} · {formatDate(lead.createdAt)}
            </p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Customer + Vehicle */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Клиент</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Имя</p>
                    <p className="font-medium">{lead.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Телефон</p>
                    <p className="flex items-center gap-1 font-medium">
                      <Phone className="h-3 w-3" />
                      {lead.customerPhone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telegram</p>
                    <p className="flex items-center gap-1 font-medium">
                      <MessageSquare className="h-3 w-3" />
                      {lead.customerTelegram || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="flex items-center gap-1 font-medium">
                      <Mail className="h-3 w-3" />
                      {lead.customerEmail || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle configuration */}
            {config && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="h-4 w-4" />
                    Автомобиль
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Марка</p>
                      <p className="font-medium">{config.brandName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Модель</p>
                      <p className="font-medium">{config.modelName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Комплектация</p>
                      <p className="font-medium">{config.trimName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Состояние</p>
                      <p className="font-medium">{config.condition || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Страна</p>
                      <p className="flex items-center gap-1 font-medium">
                        <MapPin className="h-3 w-3" />
                        {config.sourceCountry || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Цена</p>
                      <p className="font-medium">{formatPrice(config.sourcePrice)}</p>
                    </div>
                  </div>

                  {/* Configuration details */}
                  {configJson && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Конфигурация
                        </p>
                        <div className="space-y-1 text-sm">
                          {configJson.exterior_color && (
                            <p>Кузов: {configJson.exterior_color}</p>
                          )}
                          {configJson.interior_color && (
                            <p>Салон: {configJson.interior_color}</p>
                          )}
                          {configJson.wheels && (
                            <p>Колёса: {configJson.wheels}</p>
                          )}
                          {configJson.options?.length > 0 && (
                            <p>Опции: {configJson.options.join(", ")}</p>
                          )}
                          {configJson.unpriced_options?.length > 0 && (
                            <p className="text-amber-600">
                              Цена уточняется: {configJson.unpriced_options.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Cost breakdown */}
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Расчёт стоимости
                    </p>
                    <div className="space-y-1 text-sm">
                      {config.sourcePrice && (
                        <div className="flex justify-between">
                          <span>Цена автомобиля</span>
                          <span>{formatPrice(config.sourcePrice)}</span>
                        </div>
                      )}
                      {config.logisticsCost && (
                        <div className="flex justify-between">
                          <span>Логистика</span>
                          <span>{formatPrice(config.logisticsCost)}</span>
                        </div>
                      )}
                      {config.customsCost && (
                        <div className="flex justify-between">
                          <span>Таможня</span>
                          <span>{formatPrice(config.customsCost)}</span>
                        </div>
                      )}
                      {config.serviceFee && (
                        <div className="flex justify-between">
                          <span>Сервисный сбор</span>
                          <span>{formatPrice(config.serviceFee)}</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Итого</span>
                        <span className="text-emerald-600">
                          {formatPrice(config.estimatedTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comment */}
            {lead.comment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Комментарий клиента</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{lead.comment}</p>
                </CardContent>
              </Card>
            )}

            {/* UTM */}
            {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">UTM-метки</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {lead.utmSource && <p>Source: {lead.utmSource}</p>}
                  {lead.utmMedium && <p>Medium: {lead.utmMedium}</p>}
                  {lead.utmCampaign && <p>Campaign: {lead.utmCampaign}</p>}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <LeadNotes leadId={lead.id} notes={lead.notes} />
          </div>

          {/* Right column - Actions + Timeline */}
          <div className="space-y-6">
            {/* Actions */}
            <LeadDetailActions
              leadId={lead.id}
              currentStatus={lead.status}
              currentManagerId={lead.assignedManagerId}
              managers={managers}
              userRole={user.role}
              nextFollowUpAt={lead.nextFollowUpAt}
            />

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">История</CardTitle>
              </CardHeader>
              <CardContent>
                <LeadTimeline activities={lead.activities} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
