"use client";

import { CheckCircle, Clock, Circle, Truck, FileText, Phone, MessageSquare, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/status-badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { formatDate, formatUsd } from "@/lib/format";

interface OrderData {
  lead: {
    id: string;
    status: string;
    customerName: string;
    estimatedTotalUsd: string | null;
    createdAt: string;
  };
  vehicle: {
    status: string;
    vin: string | null;
    location: string | null;
    expectedDate: string | null;
  } | null;
  configuration: {
    brandName: string | null;
    modelName: string | null;
    trimName: string | null;
    sourceCountry: string | null;
    condition: string | null;
    configurationJson: Record<string, unknown> | null;
  } | null;
  quotes: {
    id: string;
    status: string;
    configurationJson: Record<string, unknown> | null;
    validUntil: string | null;
    createdAt: string;
    sentAt: string | null;
  }[];
}

const STATUS_STEPS = [
  { key: "new", label: "Заявка создана", icon: FileText },
  { key: "assigned", label: "Менеджер назначен", icon: Phone },
  { key: "contacted", label: "Связались с вами", icon: MessageSquare },
  { key: "qualified", label: "Заявка подтверждена", icon: CheckCircle },
  { key: "quote_sent", label: "Расчёт отправлен", icon: FileText },
  { key: "negotiation", label: "Переговоры", icon: MessageSquare },
  { key: "in_transit", label: "Автомобиль в пути", icon: Truck },
  { key: "delivered", label: "Автомобиль доставлен", icon: Package },
  { key: "won", label: "Заказ оформлен", icon: CheckCircle },
];

const STATUS_ORDER = STATUS_STEPS.map((s) => s.key);

const CONDITION_LABELS: Record<string, string> = {
  new: "Новый",
  used: "С пробегом",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Заявка создана",
  assigned: "Назначен менеджер",
  contacted: "Связались",
  qualified: "Подтверждена",
  quote_sent: "Расчёт отправлен",
  negotiation: "Переговоры",
  in_transit: "В пути",
  delivered: "Доставлен",
  won: "Оформлен",
};

function ConfigRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ConfigDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function OrderTracker({ order }: { order: OrderData }) {
  const { lead, vehicle, configuration, quotes } = order;
  const currentStepIndex = STATUS_ORDER.indexOf(lead.status);

  const configJson = configuration?.configurationJson as Record<string, string> | null;
  const options = configJson?.options as string[] | undefined;
  const priceBreakdown = configJson?.price_breakdown as Record<string, string> | undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Заказ {lead.id.slice(0, 8)}</h2>
          <StatusBadge status={lead.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Создан {formatDate(lead.createdAt)}
        </p>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статус заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-0">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        isCompleted
                          ? "bg-brand-muted text-brand"
                          : "bg-muted text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-brand ring-offset-2" : ""}`}
                    >
                      {isCompleted && !isCurrent ? (
                        <CheckCircle className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          index < currentStepIndex ? "bg-brand/40" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex flex-col pb-4">
                    <span
                      className={`text-sm font-medium ${
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-xs text-brand">Текущий статус</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle delivery status */}
      {vehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Статус автомобиля</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <AvailabilityBadge
              status={vehicle.status}
              location={vehicle.location}
              expectedDate={vehicle.expectedDate}
            />
            {vehicle.vin && (
              <p className="text-sm text-muted-foreground">
                VIN: <span className="font-mono">{vehicle.vin}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehicle Info */}
      {configuration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Автомобиль</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <ConfigRow label="Марка" value={configuration.brandName} />
              <ConfigRow label="Модель" value={configuration.modelName} />
              <ConfigRow label="Комплектация" value={configuration.trimName} />
              <ConfigRow
                label="Состояние"
                value={CONDITION_LABELS[configuration.condition || ""] || configuration.condition}
              />
              <ConfigRow label="Страна отправления" value={configuration.sourceCountry} />
              {lead.estimatedTotalUsd && (
                <div>
                  <p className="text-muted-foreground">Ориентировочная стоимость</p>
                  <p className="text-lg font-semibold text-brand">
                    {formatUsd(lead.estimatedTotalUsd)}
                  </p>
                </div>
              )}
            </div>

            {/* Configuration details */}
            {configJson && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  Конфигурация
                </p>
                <div className="flex flex-col gap-1.5">
                  {configJson.exterior_color && (
                    <ConfigDetail label="Цвет кузова" value={configJson.exterior_color} />
                  )}
                  {configJson.interior_color && (
                    <ConfigDetail label="Цвет салона" value={configJson.interior_color} />
                  )}
                  {configJson.wheels && (
                    <ConfigDetail label="Колёса" value={configJson.wheels} />
                  )}
                  {configJson.engine && (
                    <ConfigDetail label="Двигатель" value={configJson.engine} />
                  )}
                  {configJson.transmission && (
                    <ConfigDetail label="Коробка передач" value={configJson.transmission} />
                  )}
                  {configJson.drivetrain && (
                    <ConfigDetail label="Привод" value={configJson.drivetrain} />
                  )}
                </div>
              </div>
            )}

            {/* Options */}
            {options && options.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  Опции
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((opt) => (
                    <span
                      key={opt}
                      className="inline-flex items-center rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-medium text-brand ring-1 ring-brand/25"
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price breakdown */}
            {priceBreakdown && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  Стоимость
                </p>
                <div className="flex flex-col gap-1">
                  {Object.entries(priceBreakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quotes */}
      {quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Расчёты</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">Расчёт #{quote.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(quote.createdAt)}
                      {quote.validUntil && (
                        <span> · действителен до {formatDate(quote.validUntil)}</span>
                      )}
                    </p>
                    {quote.sentAt && (
                      <p className="text-xs text-muted-foreground">
                        Отправлен {formatDate(quote.sentAt)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={quote.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Контакты</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            По вопросам по вашему заказу свяжитесь с вашим менеджером или позвоните нам.
          </p>
          <div className="mt-3 flex gap-3">
            <a
              href="tel:+998901234567"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-deep"
            >
              <Phone className="size-4" />
              Позвонить
            </a>
            <a
              href="https://t.me/+998901234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <MessageSquare className="size-4" />
              Telegram
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
