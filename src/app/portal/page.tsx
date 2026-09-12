"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Loader2,
  Car,
  Phone,
  Info,
  Eye,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OrderTracker } from "@/components/portal/order-tracker";
import { formatUsd } from "@/lib/format";
import { buildJourneySteps, JOURNEY_STAGES } from "@/lib/journey";

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

function demoJourney(
  currentStage: number,
  confirmedAt: Record<number, string> = {}
): OrderData["journey"] {
  const stageLabels: Record<number, string> = Object.fromEntries(
    JOURNEY_STAGES.map((s) => [s.stage, s.label])
  );
  return {
    currentStage,
    currentLabel: stageLabels[currentStage] || "",
    total: JOURNEY_STAGES.length,
    steps: buildJourneySteps(currentStage, confirmedAt),
  };
}

function demoPhotos(slug: string): OrderData["photos"] {
  const parts = ["", "-front", "-interior", "-side", "-rear"];
  return parts.map((part) => ({
    url: `/images/cars/${slug}${part}.jpg`,
    alt: null,
  }));
}

function demoPayments(items: {
  label: string;
  amount: string;
  paid?: boolean;
  date?: string;
}[]): OrderData["payments"] {
  return items.map((item, index) => ({
    id: `payment-demo-${index}`,
    label: item.label,
    amount: item.amount,
    currency: "USD",
    dueDate: item.paid ? null : item.date || null,
    paidAt: item.paid ? item.date || null : null,
    sortOrder: index,
  }));
}

function demoInspection(slug: string, date: string): InspectionMedia[] {
  return [
    {
      id: `inspection-${slug}-1`,
      kind: "photo",
      url: `/images/cars/${slug}-side.jpg`,
      caption: "Осмотр кузова",
      mimeType: "image/jpeg",
      createdAt: date,
    },
    {
      id: `inspection-${slug}-2`,
      kind: "photo",
      url: `/images/cars/${slug}-interior.jpg`,
      caption: "Проверка салона",
      mimeType: "image/jpeg",
      createdAt: date,
    },
  ];
}

const DEMO_ORDERS: OrderData[] = [
  {
    lead: {
      id: "demo-001-alexey",
      status: "won",
      customerName: "Алексей Ким",
      estimatedTotalUsd: "42500",
      createdAt: "2026-06-10T10:30:00Z",
    },
    vehicle: null,
    configuration: {
      brandName: "BYD",
      modelName: "Song Plus",
      trimName: "DM-i Champion 110km",
      sourceCountry: "Китай",
      condition: "new",
      configurationJson: {
        exterior_color: "Белый жемчуг",
        interior_color: "Чёрный",
        wheels: '19" Спортивные',
        engine: "1.5L PHEV 160 л.с.",
        transmission: "DCT 6-ступенчатая",
        drivetrain: "Передний",
        options: ["Панорамная крыша", "360° камера", "Подогрев сидений", "Светодиодные фары", "12.8\" мультимедиа"],
        price_breakdown: {
          "Стоимость авто (FOB)": "$34 200",
          "Доставка до Ташкента": "$2 800",
          "Таможенные пошлины": "$3 500",
          "Акциз и НДС": "$1 200",
          "Сертификация и растаможка": "$800",
        },
      },
    },
    quotes: [
      {
        id: "quote-demo-001a",
        status: "sent",
        configurationJson: null,
        validUntil: "2026-07-10T00:00:00Z",
        createdAt: "2026-06-12T14:00:00Z",
        sentAt: "2026-06-12T14:05:00Z",
      },
      {
        id: "quote-demo-001b",
        status: "accepted",
        configurationJson: null,
        validUntil: "2026-08-10T00:00:00Z",
        createdAt: "2026-06-15T10:30:00Z",
        sentAt: "2026-06-15T10:35:00Z",
      },
    ],
    journey: demoJourney(2, { 1: "2026-06-15T10:30:00Z" }),
    photos: demoPhotos("byd-song-plus"),
    payments: demoPayments([
      { label: "Предоплата по договору", amount: "12840", paid: true, date: "2026-06-16T00:00:00Z" },
      { label: "Финальный платёж", amount: "29660", date: "2026-08-10T00:00:00Z" },
    ]),
    messages: [],
    inspectionMedia: [],
  },
  {
    lead: {
      id: "demo-002-irina",
      status: "in_transit",
      customerName: "Ирина Пак",
      estimatedTotalUsd: "38900",
      createdAt: "2026-07-05T09:15:00Z",
    },
    vehicle: {
      id: "vehicle-demo-002",
      status: "in_transit",
      vin: "LSVAA26E7NS012345",
      location: "Море · порт Пусан",
      expectedDate: "2026-09-20T00:00:00Z",
    },
    configuration: {
      brandName: "Zeekr",
      modelName: "7X",
      trimName: "Core RWD · 75 kWh",
      sourceCountry: "Китай",
      condition: "new",
      configurationJson: {
        exterior_color: "Графитовый",
        interior_color: "Бежевый",
        wheels: '19" Аэродинамические',
        engine: "Электро 428 л.с.",
        transmission: "Редуктор",
        drivetrain: "Задний",
        options: ["LED фары", "Кожаный салон", "Беспроводная зарядка", "Панорамная крыша", "Круиз-контроль"],
        price_breakdown: {
          "Стоимость авто (FOB)": "$28 500",
          "Доставка до Ташкента": "$3 100",
          "Таможенные пошлины": "$3 800",
          "Акциз и НДС": "$1 800",
          "Сертификация и растаможка": "$700",
        },
      },
    },
    quotes: [
      {
        id: "quote-demo-002",
        status: "accepted",
        configurationJson: null,
        validUntil: "2026-08-05T00:00:00Z",
        createdAt: "2026-07-08T11:00:00Z",
        sentAt: "2026-07-08T11:10:00Z",
      },
    ],
    journey: demoJourney(5, {
      1: "2026-07-08T11:10:00Z",
      2: "2026-07-12T09:00:00Z",
      3: "2026-07-18T14:30:00Z",
      4: "2026-07-25T10:00:00Z",
    }),
    photos: demoPhotos("zeekr-7x"),
    payments: demoPayments([
      { label: "Предоплата по договору", amount: "12840", paid: true, date: "2026-07-09T00:00:00Z" },
      { label: "Оплата поставщику", amount: "17100", paid: true, date: "2026-07-26T00:00:00Z" },
      { label: "Финальный платёж", amount: "8960", date: "2026-09-25T00:00:00Z" },
    ]),
    messages: [],
    inspectionMedia: demoInspection("zeekr-7x", "2026-07-20T10:00:00Z"),
  },
  {
    lead: {
      id: "demo-003-dmitry",
      status: "delivered",
      customerName: "Дмитрий Чой",
      estimatedTotalUsd: "51200",
      createdAt: "2026-05-20T16:45:00Z",
    },
    vehicle: {
      id: "vehicle-demo-003",
      status: "sold",
      vin: "L6T78Z4U0PN012345",
      location: "Ташкент, склад Сергели",
      expectedDate: null,
    },
    configuration: {
      brandName: "Geely",
      modelName: "Monjaro",
      trimName: "Hi-Power AWD",
      sourceCountry: "Китай",
      condition: "new",
      configurationJson: {
        exterior_color: "Чёрный",
        interior_color: "Красный",
        wheels: '20" Спортивные',
        engine: "2.0T 238 л.с.",
        transmission: "AT 8-ступенчатая",
        drivetrain: "Полный (AWD)",
        options: [
          "Harman Kardon",
          "Адаптивный круиз",
          "Вентиляция сидений",
          "Пневмоподвеска",
          "Электропривод двери багажника",
          "Подогрев руля",
        ],
        price_breakdown: {
          "Стоимость авто (FOB)": "$38 000",
          "Доставка до Ташкента": "$3 400",
          "Таможенные пошлины": "$4 200",
          "Акциз и НДС": "$2 100",
          "Сертификация и растаможка": "$500",
        },
      },
    },
    quotes: [
      {
        id: "quote-demo-003a",
        status: "sent",
        configurationJson: null,
        validUntil: "2026-06-20T00:00:00Z",
        createdAt: "2026-05-22T10:00:00Z",
        sentAt: "2026-05-22T10:15:00Z",
      },
      {
        id: "quote-demo-003b",
        status: "accepted",
        configurationJson: null,
        validUntil: "2026-07-20T00:00:00Z",
        createdAt: "2026-05-25T09:00:00Z",
        sentAt: "2026-05-25T09:10:00Z",
      },
    ],
    journey: demoJourney(7, {
      1: "2026-05-25T09:10:00Z",
      2: "2026-05-28T10:00:00Z",
      3: "2026-06-02T12:00:00Z",
      4: "2026-06-05T11:00:00Z",
      5: "2026-06-06T09:00:00Z",
      6: "2026-07-10T15:00:00Z",
      7: "2026-07-15T10:00:00Z",
    }),
    photos: demoPhotos("geely-monjaro"),
    payments: demoPayments([
      { label: "Предоплата по договору", amount: "15360", paid: true, date: "2026-05-26T00:00:00Z" },
      { label: "Оплата поставщику", amount: "30720", paid: true, date: "2026-06-05T00:00:00Z" },
      { label: "Финальный платёж", amount: "5120", paid: true, date: "2026-07-16T00:00:00Z" },
    ]),
    messages: [],
    inspectionMedia: demoInspection("geely-monjaro", "2026-06-03T10:00:00Z"),
  },
];

type View = "home" | "list" | "detail";

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const leadIdParam = searchParams.get("leadId");
  const ordersParam = searchParams.get("orders");
  const quoteIdParam = searchParams.get("quoteId");

  const [view, setView] = useState<View>("home");
  const [lookupType, setLookupType] = useState<"phone" | "quoteId">("phone");
  const [phone, setPhone] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Store the current orders query so back-to-list can restore it
  const [currentOrdersQuery, setCurrentOrdersQuery] = useState<string | null>(
    null
  );

  const goTo = useCallback(
    (params: Record<string, string | null>) => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== null) sp.set(key, value);
      }
      const qs = sp.toString();
      router.push(qs ? `/portal?${qs}` : "/portal", { scroll: true });
    },
    [router]
  );

  // Resolve view from URL params
  useEffect(() => {
    if (leadIdParam) {
      // Check demo data first
      const found = DEMO_ORDERS.find((o) => o.lead.id === leadIdParam);
      if (found) {
        setSelectedOrder(found);
        setIsDemoMode(true);
        setView("detail");
        return;
      }
      // Fetch real order by lead ID
      setLoading(true);
      setError(null);
      fetch(`/api/portal/lookup?leadId=${leadIdParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.lead) {
            setSelectedOrder(data);
            setIsDemoMode(false);
            setView("detail");
          } else {
            setError("Заказ не найден");
            setView("home");
          }
        })
        .catch(() => {
          setError("Ошибка сети");
          setView("home");
        })
        .finally(() => setLoading(false));
    } else if (quoteIdParam) {
      setLoading(true);
      setError(null);
      fetch(`/api/portal/lookup?quoteId=${quoteIdParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.lead) {
            setSelectedOrder(data);
            setIsDemoMode(false);
            setView("detail");
          } else {
            setError("Расчёт не найден");
            setView("home");
          }
        })
        .catch(() => {
          setError("Ошибка сети");
          setView("home");
        })
        .finally(() => setLoading(false));
    } else if (ordersParam) {
      setCurrentOrdersQuery(ordersParam);

      if (ordersParam === "demo") {
        setOrders(DEMO_ORDERS);
        setIsDemoMode(true);
        setView("list");
        setSelectedOrder(null);
      } else if (ordersParam.startsWith("phone:")) {
        const phoneValue = ordersParam.slice(6);
        setLoading(true);
        setError(null);
        fetch(
          `/api/portal/lookup?phone=${encodeURIComponent(phoneValue)}`
        )
          .then((r) => r.json())
          .then((data) => {
            if (data.orders && data.orders.length > 0) {
              setOrders(data.orders);
              setIsDemoMode(false);
              setView("list");
              setSelectedOrder(null);
            } else {
              setError(data.error || "Заказы не найдены");
              setView("home");
            }
          })
          .catch(() => {
            setError("Ошибка сети");
            setView("home");
          })
          .finally(() => setLoading(false));
      }
    } else {
      setView("home");
      setSelectedOrder(null);
      setOrders([]);
      setIsDemoMode(false);
    }
  }, [leadIdParam, ordersParam, quoteIdParam]);

  function handleSelectOrder(order: OrderData) {
    setSelectedOrder(order);
    setView("detail");
    goTo({ leadId: order.lead.id, orders: null });
  }

  function handleBackToList() {
    setSelectedOrder(null);
    if (currentOrdersQuery) {
      setOrders(orders.length > 0 ? orders : isDemoMode ? DEMO_ORDERS : []);
      setView("list");
      goTo({ orders: currentOrdersQuery, leadId: null });
    } else {
      handleBackToHome();
    }
  }

  function handleBackToHome() {
    setSelectedOrder(null);
    setOrders([]);
    setIsDemoMode(false);
    setCurrentOrdersQuery(null);
    setView("home");
    goTo({});
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (lookupType === "phone") {
        goTo({ orders: `phone:${phone}`, leadId: null, quoteId: null });
      } else {
        goTo({ quoteId, orders: null, leadId: null });
      }
    } finally {
      setLoading(false);
    }
  }

  // Loading
  if (loading && view === "home") {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Detail view
  if (view === "detail" && selectedOrder) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <button
            onClick={handleBackToList}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Назад к списку
          </button>
          {isDemoMode && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              <b>Демонстрационный режим</b> · Даты, суммы и материалы ниже
              показаны только для презентации.
            </div>
          )}
          <OrderTracker order={selectedOrder} />
        </div>
      </div>
    );
  }

  // List view
  if (view === "list" && orders.length > 0) {
    return (
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <button
            onClick={handleBackToHome}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Новый поиск
          </button>
          {isDemoMode && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Демо-режим — пример того, как клиент будет видеть свои заказы
            </div>
          )}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">
              Ваши заказы ({orders.length})
            </h2>
            {orders.map((order) => {
              const completed = order.journey.currentStage - 1;
              const percent = Math.round(
                (completed / order.journey.total) * 100
              );
              return (
                <button
                  key={order.lead.id}
                  onClick={() => handleSelectOrder(order)}
                  className="flex items-center justify-between rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {order.configuration
                          ? `${order.configuration.brandName || ""} ${order.configuration.modelName || ""}`.trim()
                          : `Заказ #${order.lead.id.slice(0, 8)}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.configuration?.trimName &&
                        `${order.configuration.trimName} · `}
                      {order.journey.currentLabel}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.max(percent, 4)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {completed} из {order.journey.total} этапов
                      </span>
                    </div>
                  </div>
                  {order.lead.estimatedTotalUsd && (
                    <span className="text-sm font-semibold text-brand">
                      {formatUsd(order.lead.estimatedTotalUsd)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Home / lookup form
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-muted">
            <Car className="size-7 text-brand" />
          </div>
          <h1 className="text-2xl font-bold">Отследить заказ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Узнайте статус вашего автомобиля и расчёта
          </p>
        </div>

        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Для демонстрации используйте:</p>
              <ul className="mt-1 list-disc pl-4 text-blue-700">
                <li>
                  Телефон:{" "}
                  <code className="rounded bg-blue-100 px-1">
                    90 111 22 33
                  </code>
                </li>
                <li>
                  Телефон:{" "}
                  <code className="rounded bg-blue-100 px-1">
                    91 222 33 44
                  </code>
                </li>
                <li>
                  Телефон:{" "}
                  <code className="rounded bg-blue-100 px-1">
                    93 333 44 55
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => goTo({ orders: "demo", leadId: null })}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand/40 bg-brand-muted px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-brand-muted"
        >
          <Eye className="size-4" />
          Посмотреть демо-заказы
        </button>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleLookup} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLookupType("phone")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    lookupType === "phone"
                      ? "border-brand bg-brand-muted text-brand"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Phone className="size-4" />
                  По телефону
                </button>
                <button
                  type="button"
                  onClick={() => setLookupType("quoteId")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    lookupType === "quoteId"
                      ? "border-brand bg-brand-muted text-brand"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Car className="size-4" />
                  По номеру расчёта
                </button>
              </div>

              {lookupType === "phone" ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Номер телефона
                  </label>
                  <Input
                    type="tel"
                    placeholder="90 111 22 33"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Номер, указанный при оформлении заявки (без +998)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">
                    Номер расчёта
                  </label>
                  <Input
                    placeholder="UUID из письма с расчётом"
                    value={quoteId}
                    onChange={(e) => setQuoteId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    ID расчёта из отправленного вам письма
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search data-icon="inline-start" className="size-4" />
                )}
                Найти заказ
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Номер телефона должен совпадать с указанным при оформлении заявки.
        </p>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/40">
          <div className="mx-auto max-w-2xl px-4 py-16 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
