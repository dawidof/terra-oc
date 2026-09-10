import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Car, Mail, MapPin, MessageSquare, Phone } from "lucide-react";

import { LeadCostEditor } from "@/components/crm/lead-cost-editor";
import { LeadDetailActions } from "@/components/crm/lead-detail-actions";
import { LeadNotes } from "@/components/crm/lead-notes";
import { LeadTimeline } from "@/components/crm/lead-timeline";
import { sourceLabel } from "@/components/crm/lead-source";
import { StatusBadge } from "@/components/crm/status-badge";
import { Heading } from "@/components/ui/section";
import { Separator } from "@/components/ui/separator";
import { getAllManagers, getLeadById } from "@/lib/crm";
import { formatDate } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Заявка — TerraAuto CRM",
};

interface ConfigJson {
  exterior_color?: string;
  interior_color?: string;
  wheels?: string;
  options?: string[];
  unpriced_options?: string[];
  totalDelta?: number;
  options_with_prices?: {
    name: string;
    priceDelta: number;
    priceKnown: boolean;
    groupType: string;
  }[];
  additional_costs?: { label: string; amount: number }[];
  car_options?: { label: string; amount: number }[];
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

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) notFound();

  const managers = await getAllManagers();

  const config = lead.configuration;
  const configJson = config?.configurationJson as ConfigJson | null;
  const computedBreakdown = lead.computedBreakdown;
  const optionsWithPrices = configJson?.options_with_prices || lead.resolvedOptionsWithPrices || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/crm/leads"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Заявки
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Heading size="md">{lead.customerName}</Heading>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Заявка #{lead.id.slice(0, 8)} · {formatDate(lead.createdAt)}
            {lead.source && <span> · {sourceLabel(lead.source)}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Customer info */}
          <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Клиент
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Имя</p>
                <p className="font-medium">{lead.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Телефон</p>
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <Phone className="size-3.5 text-muted-foreground" aria-hidden />
                  {lead.customerPhone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telegram</p>
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <MessageSquare className="size-3.5 text-muted-foreground" aria-hidden />
                  {lead.customerTelegram || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="inline-flex items-center gap-1.5 font-medium">
                  <Mail className="size-3.5 text-muted-foreground" aria-hidden />
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
          </div>

          {/* Vehicle info */}
          {config && (
            <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <Car className="size-3.5" aria-hidden />
                Автомобиль
              </p>

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
                  <p className="inline-flex items-center gap-1.5 font-medium">
                    <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                    {config.sourceCountry || "—"}
                  </p>
                </div>
              </div>

              {/* Configuration details */}
              {configJson &&
                (configJson.exterior_color ||
                  configJson.interior_color ||
                  configJson.wheels ||
                  (configJson.options?.length ?? 0) > 0) && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
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
                existingCarOptions={configJson?.car_options || []}
                configOptionsTotal={configJson?.totalDelta || 0}
                optionsWithPrices={optionsWithPrices}
                sourceCountry={config.sourceCountry || "Китай"}
                condition={config.condition || "new"}
                trimId={lead.trimId || undefined}
              />
            </div>
          )}

          {/* Comment */}
          {lead.comment && (
            <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Комментарий клиента
              </p>
              <p className="whitespace-pre-wrap text-sm">{lead.comment}</p>
            </div>
          )}

          {/* UTM */}
          {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
            <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                UTM-метки
              </p>
              <div className="space-y-2 text-sm">
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
              </div>
            </div>
          )}

          <LeadNotes leadId={lead.id} notes={lead.notes} />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <LeadDetailActions
            leadId={lead.id}
            currentStatus={lead.status}
            currentManagerId={lead.assignedManagerId}
            managers={managers}
            userRole={"manager"}
            nextFollowUpAt={lead.nextFollowUpAt}
          />

          <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              История
            </p>
            <LeadTimeline activities={lead.activities} />
          </div>
        </div>
      </div>
    </div>
  );
}
