"use client";

import { useState } from "react";
import {
  Check,
  Car,
  Phone,
  MessageSquare,
  Loader2,
  Package,
  Send,
  Truck,
} from "lucide-react";
import { QuoteStatusBadge } from "@/components/crm/status-badge";
import { AvailabilityBadge } from "@/components/availability-badge";
import { formatDate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

interface JourneyStep {
  stage: number;
  key: string;
  label: string;
  description: string;
  state: "complete" | "current" | "future";
  confirmedAt: string | null;
}

interface Payment {
  id: string;
  label: string;
  amount: string;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
}

interface ClientMessage {
  message: string;
  createdAt: string;
}

interface InspectionMedia {
  id: string;
  kind: string;
  url: string;
  caption: string | null;
  mimeType: string | null;
  createdAt: string;
}

interface OrderData {
  lead: {
    id: string;
    status: string;
    customerName: string;
    estimatedTotalUsd: string | null;
    createdAt: string;
    managerName?: string | null;
  };
  vehicle: {
    id: string;
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
    pdfUrl?: string | null;
    validUntil: string | null;
    createdAt: string;
    sentAt: string | null;
  }[];
  journey: {
    currentStage: number;
    currentLabel: string;
    total: number;
    steps: JourneyStep[];
  };
  photos: { url: string; alt: string | null }[];
  payments: Payment[];
  messages: ClientMessage[];
  inspectionMedia: InspectionMedia[];
}

const CONDITION_LABELS: Record<string, string> = {
  new: "Новый",
  used: "С пробегом",
};

function ConfigDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PhotoGallery({
  photos,
  alt,
}: {
  photos: { url: string; alt: string | null }[];
  alt: string;
}) {
  const [selected, setSelected] = useState(0);
  if (photos.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-xl bg-muted">
        <img
          src={photos[selected].url}
          alt={photos[selected].alt || alt}
          className="aspect-[16/10] w-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setSelected(index)}
              className={cn(
                "shrink-0 overflow-hidden rounded-lg ring-2 transition-all",
                index === selected
                  ? "ring-brand"
                  : "ring-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={photo.url}
                alt={photo.alt || alt}
                className="size-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageForm({
  leadId,
  onSent,
}: {
  leadId: string;
  onSent: (message: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) return;

    setSending(true);
    try {
      const res = await fetch("/api/portal/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, message: message.trim() }),
      });

      if (res.ok) {
        onSent(message.trim());
        setMessage("");
        setSent(true);
      }
    } catch {
      // keep form state for retry
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700 ring-1 ring-green-200">
        <Check className="size-4" />
        Сообщение отправлено. Мы ответим вам в ближайшее время.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        Сообщение
        <textarea
          maxLength={500}
          required
          minLength={2}
          rows={3}
          placeholder="Например, когда будет следующее обновление?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      <button
        type="submit"
        disabled={sending || message.trim().length < 2}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-deep disabled:opacity-50"
      >
        {sending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Написать менеджеру
      </button>
    </form>
  );
}

export function OrderTracker({ order }: { order: OrderData }) {
  const { lead, vehicle, configuration, quotes, journey, photos, payments } = order;
  const [localMessages, setLocalMessages] = useState<ClientMessage[]>(order.messages);
  const inspectionMedia = order.inspectionMedia;

  const carName = configuration
    ? `${configuration.brandName || ""} ${configuration.modelName || ""}`.trim() ||
      "Ваш заказ"
    : "Ваш заказ";

  const completed = journey.currentStage - 1;
  const progressPercent = Math.round((completed / journey.total) * 100);
  const isFinished = journey.currentStage >= journey.total;

  const configJson = configuration?.configurationJson as
    | Record<string, unknown>
    | null;
  const options = configJson?.options as string[] | undefined;
  const priceBreakdown = configJson?.price_breakdown as
    | Record<string, string>
    | undefined;

  const totalPaid = payments
    .filter((p) => p.paidAt)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPayments = payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const balance = totalPayments - totalPaid;
  const agreedPrice = lead.estimatedTotalUsd
    ? Number(lead.estimatedTotalUsd)
    : totalPayments || null;

  const stepDescription = (step: JourneyStep): string =>
    step.key === "inspection" && inspectionMedia.length > 0
      ? "Фото и видео проверки доступны ниже."
      : step.description;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-brand">
            TerraAuto · статус заказа
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{carName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Вся ключевая информация по поставке — в одном месте. Мы обновляем
            этапы, когда они подтверждены командой.
          </p>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completed} из {journey.total} этапов
            </span>
            <strong className="font-semibold">{journey.currentLabel}</strong>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.max(progressPercent, 4)}%` }}
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Journey timeline */}
          <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Маршрут заказа
                </p>
                <h2 className="mt-0.5 text-lg font-semibold">
                  Сейчас: {journey.currentLabel}
                </h2>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                  isFinished
                    ? "bg-green-100 text-green-700"
                    : "bg-brand-muted text-brand"
                )}
              >
                {isFinished ? "Завершён" : "В работе"}
              </span>
            </div>

            <ol className="flex flex-col">
              {journey.steps.map((step) => (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                        step.state === "complete" &&
                          "bg-brand text-white",
                        step.state === "current" &&
                          "bg-brand-muted text-brand ring-2 ring-brand ring-offset-2",
                        step.state === "future" &&
                          "bg-muted text-muted-foreground"
                      )}
                    >
                      {step.state === "complete" ? (
                        <Check className="size-4" />
                      ) : (
                        String(step.stage).padStart(2, "0")
                      )}
                    </span>
                    {step.stage < journey.total && (
                      <span
                        className={cn(
                          "w-0.5 flex-1",
                          step.state === "complete" ? "bg-brand/40" : "bg-muted"
                        )}
                        style={{ minHeight: 24 }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-5">
                    <b
                      className={cn(
                        "text-sm",
                        step.state === "future"
                          ? "text-muted-foreground"
                          : "font-medium"
                      )}
                    >
                      {step.label}
                    </b>
                    {step.state === "complete" && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {stepDescription(step)}
                        </p>
                        <small className="text-xs text-brand">
                          Подтверждено{" "}
                          {step.confirmedAt
                            ? formatDate(step.confirmedAt)
                            : "командой"}
                        </small>
                      </>
                    )}
                    {step.state === "current" && (
                      <small className="text-xs text-muted-foreground">
                        Следующее подтверждение появится здесь
                      </small>
                    )}
                    {step.state === "future" && (
                      <small className="text-xs text-muted-foreground">
                        Ожидает предыдущих этапов
                      </small>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Inspection materials */}
          {inspectionMedia.length > 0 && (
            <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Подтверждающие материалы
                  </p>
                  <h2 className="mt-0.5 text-lg font-semibold">
                    Проверка автомобиля
                  </h2>
                </div>
                <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Показано клиенту
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {inspectionMedia.map((item) => (
                  <figure
                    key={item.id}
                    className="flex flex-col gap-1.5 overflow-hidden rounded-xl bg-muted/50 ring-1 ring-foreground/10"
                  >
                    {item.kind === "photo" ? (
                      <img
                        src={item.url}
                        alt={item.caption || "Материал проверки автомобиля"}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={item.url}
                        controls
                        preload="metadata"
                        className="aspect-[4/3] w-full bg-black object-cover"
                      />
                    )}
                    <figcaption className="flex flex-col gap-0.5 px-3 pb-2.5 pt-1.5">
                      {item.caption && (
                        <span className="text-sm font-medium">{item.caption}</span>
                      )}
                      <small className="text-xs text-muted-foreground">
                        Добавлено {formatDate(item.createdAt)}
                      </small>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Vehicle card with photos */}
          {configuration && (
            <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ваш автомобиль
                  </p>
                  <h2 className="mt-0.5 text-lg font-semibold">{carName}</h2>
                </div>
                {vehicle && (
                  <AvailabilityBadge
                    status={vehicle.status}
                    location={vehicle.location}
                    expectedDate={vehicle.expectedDate}
                  />
                )}
              </div>

              <PhotoGallery photos={photos} alt={carName} />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {configuration.trimName && (
                  <ConfigDetail label="Комплектация" value={configuration.trimName} />
                )}
                {configuration.sourceCountry && (
                  <ConfigDetail
                    label="Страна отправления"
                    value={configuration.sourceCountry}
                  />
                )}
                {configuration.condition && (
                  <ConfigDetail
                    label="Состояние"
                    value={
                      CONDITION_LABELS[configuration.condition] ||
                      configuration.condition
                    }
                  />
                )}
                {typeof configJson?.exterior_color === "string" && (
                  <ConfigDetail
                    label="Цвет кузова"
                    value={configJson.exterior_color}
                  />
                )}
                {typeof configJson?.interior_color === "string" && (
                  <ConfigDetail
                    label="Цвет салона"
                    value={configJson.interior_color}
                  />
                )}
                {typeof configJson?.engine === "string" && (
                  <ConfigDetail label="Двигатель" value={configJson.engine} />
                )}
                {typeof configJson?.transmission === "string" && (
                  <ConfigDetail
                    label="КПП"
                    value={configJson.transmission}
                  />
                )}
                {typeof configJson?.drivetrain === "string" && (
                  <ConfigDetail label="Привод" value={configJson.drivetrain} />
                )}
              </div>

              {options && options.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
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

              {/* Delivery tracking */}
              {vehicle && (
                <div className="flex flex-col gap-2 border-t border-border pt-3">
                  <p className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                    <Truck className="size-3.5" aria-hidden />
                    Доставка
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {vehicle.vin && (
                      <ConfigDetail label="VIN" value={vehicle.vin} />
                    )}
                    {vehicle.location && (
                      <ConfigDetail label="Локация" value={vehicle.location} />
                    )}
                    {vehicle.expectedDate && (
                      <ConfigDetail
                        label="Ожидаемая дата"
                        value={formatDate(vehicle.expectedDate)}
                      />
                    )}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          {/* Finance */}
          <section className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Финансы
                </p>
                <h2 className="mt-0.5 text-lg font-semibold">
                  {payments.length > 0 ? "График оплаты" : "Стоимость"}
                </h2>
              </div>
              {agreedPrice && (
                <strong className="shrink-0 text-lg font-semibold text-brand">
                  {formatUsd(String(agreedPrice))}
                </strong>
              )}
            </div>

            {payments.length > 0 ? (
              <>
                <ul className="flex flex-col gap-2">
                  {payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <span>
                        <b
                          className={cn(
                            "block text-sm",
                            payment.paidAt && "text-muted-foreground"
                          )}
                        >
                          {payment.label}
                        </b>
                        <small className="text-xs text-muted-foreground">
                          {payment.paidAt
                            ? `Оплачено · ${formatDate(payment.paidAt)}`
                            : payment.dueDate
                              ? `Срок: ${formatDate(payment.dueDate)}`
                              : "Срок уточняется"}
                        </small>
                      </span>
                      <strong className="shrink-0 text-sm">
                        {formatUsd(payment.amount)}
                      </strong>
                    </li>
                  ))}
                </ul>
                <p className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted-foreground">Остаток к оплате</span>
                  <b>{formatUsd(String(balance))}</b>
                </p>
              </>
            ) : (
              priceBreakdown && (
                <div className="flex flex-col gap-1">
                  {Object.entries(priceBreakdown).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>

          {/* Quotes */}
          {quotes.length > 0 && (
            <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Расчёты
              </p>
              <div className="flex flex-col gap-2">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Расчёт #{quote.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(quote.createdAt)}
                        {quote.validUntil &&
                          ` · действителен до ${formatDate(quote.validUntil)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {quote.pdfUrl && (
                        <a
                          href={quote.pdfUrl}
                          download
                          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          PDF
                        </a>
                      )}
                      <QuoteStatusBadge status={quote.status} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Contact + message form */}
          <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Связь с менеджером
            </p>
            <h2 className="text-lg font-semibold">Есть вопрос по заказу?</h2>
            {lead.managerName && (
              <p className="text-sm">
                Ваш менеджер —{" "}
                <span className="font-medium">{lead.managerName}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Напишите здесь — сообщение сразу появится в карточке вашей заявки
              у команды TerraAuto.
            </p>

            <MessageForm
              leadId={lead.id}
              onSent={(message) =>
                setLocalMessages((prev) => [
                  { message, createdAt: new Date().toISOString() },
                  ...prev,
                ])
              }
            />

            <div className="flex gap-2 border-t border-border pt-3">
              <a
                href="tel:+998901234567"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-deep"
              >
                <Phone className="size-4" />
                Позвонить
              </a>
              <a
                href="https://t.me/+998901234567"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <MessageSquare className="size-4" />
                Telegram
              </a>
            </div>
          </section>

          {/* Message history */}
          {localMessages.length > 0 && (
            <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ваши сообщения
              </p>
              <ul className="flex flex-col gap-2">
                {localMessages.map((message, index) => (
                  <li
                    key={`${message.createdAt}-${index}`}
                    className="rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <p className="text-sm">{message.message}</p>
                    <small className="text-xs text-muted-foreground">
                      Отправлено {formatDate(message.createdAt)}
                    </small>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Ответ придёт от вашего менеджера по телефону или в Telegram.
              </p>
            </section>
          )}

          {/* Order meta */}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="size-3.5" aria-hidden />
            Заказ #{lead.id.slice(0, 8)} · создан {formatDate(lead.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
