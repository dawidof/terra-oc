"use client";

import { useState } from "react";
import { Configurator } from "@/components/configurator";
import { LeadForm } from "@/components/lead-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, Info } from "lucide-react";
import { ContactButtons } from "@/components/contact-buttons";
import { buildConfiguratorBreakdown, formatUsd } from "@/lib/price-breakdown";

interface ColorImage {
  url: string;
  alt?: string | null;
}

interface MediaImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface OptionGroup {
  id: string;
  type: string;
  name: string;
  required: boolean;
  options: {
    id: string;
    name: string;
    code: string | null;
    imageUrl: string | null;
    priceDelta: string | null;
    priceCurrency: string | null;
    priceKnown: boolean;
    available: boolean;
  }[];
}

interface ConfiguratorSectionProps {
  optionGroups: OptionGroup[];
  basePrice: number;
  estimatedTotalUsd: string | null;
  trimId: string;
  brandName: string;
  modelName: string;
  trimName: string;
  sourceCountry: string | null;
  condition: string;
  csrfToken: string;
  logisticsCost: number | null;
  customsCost: number | null;
  serviceFee: number | null;
  deliveryDays: number | null;
  colorImages?: Record<string, ColorImage[]>;
  defaultMedia?: MediaImage[];
  onColorSelect?: (groupId: string, optionId: string, images: ColorImage[], groupType: string) => void;
}

export function ConfiguratorSection({
  optionGroups,
  basePrice,
  estimatedTotalUsd,
  trimId,
  brandName,
  modelName,
  trimName,
  sourceCountry,
  condition,
  csrfToken,
  logisticsCost,
  customsCost,
  serviceFee,
  deliveryDays,
  colorImages = {},
  defaultMedia = [],
  onColorSelect,
}: ConfiguratorSectionProps) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [configuration, setConfiguration] = useState<{
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options: string[];
    unpriced_options: string[];
    totalDelta: number;
    options_with_prices: {
      name: string;
      priceDelta: number;
      priceKnown: boolean;
      groupType: string;
    }[];
  }>({
    options: [],
    unpriced_options: [],
    totalDelta: 0,
    options_with_prices: [],
  });

  const estimatedBase = estimatedTotalUsd ? Number(estimatedTotalUsd) : basePrice + 9000;

  const breakdown = buildConfiguratorBreakdown({
    basePrice,
    estimatedTotalUsd,
    logisticsCost,
    customsCost,
    serviceFee,
    optionsDelta: configuration.totalDelta,
    hasUnpricedOptions: configuration.unpriced_options.length > 0,
  });

  function handleColorSelect(_groupId: string, optionId: string, images: ColorImage[], groupType: string) {
    const galleryImages = images.length > 0
      ? images.map((img, i) => ({
          id: `${optionId}-${i}`,
          url: img.url,
          alt: img.alt,
        }))
      : defaultMedia.map((m, i) => ({ id: `${optionId}-default-${i}`, url: m.url, alt: m.alt }));

    onColorSelect?.(_groupId, optionId, galleryImages, groupType);
  }

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">Конфигурация и заявка</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Configurator */}
        <Configurator
          groups={optionGroups}
          colorImages={colorImages}
          onConfigurationChange={setConfiguration}
          onColorSelect={handleColorSelect}
        />

        {/* Lead form or CTA */}
        <div className="sticky top-20 self-start">
          {showLeadForm ? (
            <LeadForm
              vehicleName={`${brandName} ${modelName} ${trimName}`}
              estimatedTotal={estimatedBase}
              configuration={configuration}
              trimId={trimId}
              brandName={brandName}
              modelName={modelName}
              trimName={trimName}
              sourceCountry={sourceCountry || "Китай"}
              condition={condition}
              sourcePrice={basePrice}
              csrfToken={csrfToken}
              logisticsCost={logisticsCost}
              customsCost={customsCost}
              serviceFee={serviceFee}
              deliveryDays={deliveryDays}
            />
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold">Готовы к заказу?</h3>
                </div>
                <p className="mb-5 text-sm text-muted-foreground">
                  Сконфигурируйте автомобиль и отправьте заявку — менеджер подготовит точный расчёт
                  под ключ.
                </p>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стоимость автомобиля</span>
                    <span className="font-medium">{formatUsd(breakdown.vehiclePrice)}</span>
                  </div>

                  {breakdown.optionsDelta > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Доп. опции</span>
                      <span className="font-medium">+{formatUsd(breakdown.optionsDelta)}</span>
                    </div>
                  )}

                  {breakdown.logisticsCost !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Логистика</span>
                      <span className="font-medium">{formatUsd(breakdown.logisticsCost)}</span>
                    </div>
                  )}

                  {breakdown.customsCost !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Таможенные пошлины</span>
                      <span className="font-medium">{formatUsd(breakdown.customsCost)}</span>
                    </div>
                  )}

                  {breakdown.serviceFee !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Сервисный сбор</span>
                      <span className="font-medium">{formatUsd(breakdown.serviceFee)}</span>
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex justify-between text-base font-bold">
                    <span>Итого (ориентир.)</span>
                    <span className="text-emerald-600">
                      от {formatUsd(breakdown.total)}
                    </span>
                  </div>

                  {breakdown.hasUnpricedOptions && (
                    <div className="text-xs text-muted-foreground">
                      + опции с уточняемой стоимостью
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Точная стоимость рассчитывается менеджером после запроса с учётом всех опций и
                    текущих курсов.
                  </span>
                </div>

                <Button
                  size="lg"
                  className="mt-5 w-full"
                  onClick={() => setShowLeadForm(true)}
                >
                  Получить точный расчёт
                </Button>

                <div className="mt-4">
                  <ContactButtons
                    brandName={brandName}
                    modelName={modelName}
                    trimName={trimName}
                    estimatedTotal={breakdown.total}
                    variant="inline"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
