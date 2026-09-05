import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getLeadById, getAllManagers } from "@/lib/crm";
import { StatusBadge } from "@/components/crm/status-badge";
import { LeadTimeline } from "@/components/crm/lead-timeline";
import { LeadNotes } from "@/components/crm/lead-notes";
import { LeadDetailActions } from "@/components/crm/lead-detail-actions";
import { LeadCostEditor } from "@/components/crm/lead-cost-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Car,
  Calculator,
  SlidersHorizontal,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Заявка — TerraAuto CRM",
};

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Car; color: string }> = {
  calculator: { label: "Калькулятор", icon: Calculator, color: "bg-blue-100 text-blue-700" },
  configurator: { label: "Конфигуратор", icon: SlidersHorizontal, color: "bg-purple-100 text-purple-700" },
  selector: { label: "Подбор", icon: Car, color: "bg-amber-100 text-amber-700" },
};

interface ConfigJson {
  exterior_color?: string;
  interior_color?: string;
  wheels?: string;
  options?: string[];
  unpriced_options?: string[];
  totalDelta?: number;
  additional_costs?: { label: string; amount: number }[];
  calculatorBreakdown?: {
    vehiclePrice: number;
    logistics: number;
    customsDuty: number;
    exciseTax: number;
    vat: number;
    certificationFees: number;
    serviceFee: number;
    total: number;
  };
}

const CONDITION_LABELS: Record<string, string> = {
  new: "Новый",
  used: "С пробегом",
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

export default async function LeadDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const managers = await getAllManagers();
  const user = session.user as { role?: string };

  const config = lead.configuration;
  const configJson = config?.configurationJson as ConfigJson | null;
  const computedBreakdown = lead.computedBreakdown;
  const sourceInfo = SOURCE_LABELS[lead.source || ""] || null;
  const SourceIcon = sourceInfo?.icon || Car;

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
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{lead.customerName}</h1>
              {sourceInfo && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceInfo.color}`}>
                  <SourceIcon className="h-3 w-3" />
                  {sourceInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Заявка #{lead.id.slice(0, 8)} · {formatDate(lead.createdAt)}
            </p>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Клиент</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Имя</p>
                    <p className="font-medium">{lead.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Телефон</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.customerPhone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telegram</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.customerTelegram || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="flex items-center gap-1.5 font-medium">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.customerEmail || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Предпочтительная связь</p>
                    <p className="font-medium">
                      {lead.customerPreferredContact === "phone" && "Телефон"}
                      {lead.customerPreferredContact === "telegram" && "Telegram"}
                      {lead.customerPreferredContact === "whatsapp" && "WhatsApp"}
                      {!lead.customerPreferredContact && "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle info */}
            {config && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="h-4 w-4" />
                    Автомобиль
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Vehicle identity */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Марка</p>
                      <p className="font-medium">{config.brandName || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Модель</p>
                      <p className="font-medium">{config.modelName || "—"}</p>
                    </div>
                    {config.trimName && (
                      <div>
                        <p className="text-xs text-muted-foreground">Комплектация</p>
                        <p className="font-medium">{config.trimName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Состояние</p>
                      <p className="font-medium">
                        {CONDITION_LABELS[config.condition || ""] || config.condition || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Страна отправления</p>
                      <p className="flex items-center gap-1.5 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {config.sourceCountry || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Configuration details */}
                  {configJson && (configJson.exterior_color || configJson.interior_color || configJson.wheels || (configJson.options?.length ?? 0) > 0) && (
                    <>
                      <Separator />
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Конфигурация
                        </p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                          {configJson.exterior_color && (
                            <div>
                              <span className="text-muted-foreground">Кузов: </span>
                              <span className="font-medium">{configJson.exterior_color}</span>
                            </div>
                          )}
                          {configJson.interior_color && (
                            <div>
                              <span className="text-muted-foreground">Салон: </span>
                              <span className="font-medium">{configJson.interior_color}</span>
                            </div>
                          )}
                          {configJson.wheels && (
                            <div>
                              <span className="text-muted-foreground">Колёса: </span>
                              <span className="font-medium">{configJson.wheels}</span>
                            </div>
                          )}
                          {(configJson.options?.length ?? 0) > 0 && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Опции: </span>
                              <span className="font-medium">{configJson.options?.join(", ")}</span>
                            </div>
                          )}
                          {(configJson.unpriced_options?.length ?? 0) > 0 && (
                            <div className="col-span-2 text-amber-600">
                              Цена уточняется: {configJson.unpriced_options?.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Cost breakdown — interactive editor */}
                  <Separator />
                  <LeadCostEditor
                    leadId={lead.id}
                    calculatorBreakdown={configJson?.calculatorBreakdown || computedBreakdown}
                    fallbackVehiclePrice={config.sourcePrice ? Number(config.sourcePrice) : null}
                    fallbackLogistics={config.logisticsCost ? Number(config.logisticsCost) : null}
                    fallbackCustoms={config.customsCost ? Number(config.customsCost) : null}
                    fallbackServiceFee={config.serviceFee ? Number(config.serviceFee) : null}
                    fallbackTotal={config.estimatedTotal ? Number(config.estimatedTotal) : null}
                    existingAdditionalCosts={configJson?.additional_costs || []}
                    configOptionsTotal={configJson?.totalDelta || 0}
                  />
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
                  {lead.utmSource && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source</span>
                      <span className="font-medium">{lead.utmSource}</span>
                    </div>
                  )}
                  {lead.utmMedium && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medium</span>
                      <span className="font-medium">{lead.utmMedium}</span>
                    </div>
                  )}
                  {lead.utmCampaign && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaign</span>
                      <span className="font-medium">{lead.utmCampaign}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <LeadNotes leadId={lead.id} notes={lead.notes} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <LeadDetailActions
              leadId={lead.id}
              currentStatus={lead.status}
              currentManagerId={lead.assignedManagerId}
              managers={managers}
              userRole={user.role || "manager"}
              nextFollowUpAt={lead.nextFollowUpAt}
            />

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
