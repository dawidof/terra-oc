"use client";

import { useState } from "react";
import { Configurator } from "@/components/configurator";
import { LeadForm } from "@/components/lead-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

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
}: ConfiguratorSectionProps) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [configuration, setConfiguration] = useState<{
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options: string[];
    unpriced_options: string[];
    totalDelta: number;
  }>({
    options: [],
    unpriced_options: [],
    totalDelta: 0,
  });

  const estimatedBase = estimatedTotalUsd ? Number(estimatedTotalUsd) : basePrice + 9000;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-2xl font-bold">Конфигурация и заявка</h2>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Configurator */}
        <Configurator
          groups={optionGroups}
          basePrice={basePrice}
          onConfigurationChange={setConfiguration}
        />

        {/* Lead form or CTA */}
        <div>
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
              <CardContent className="flex flex-col items-center py-8 text-center">
                <Calculator className="mb-4 h-12 w-12 text-emerald-600" />
                <h3 className="mb-2 text-lg font-semibold">Готовы к заказу?</h3>
                <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                  Сконфигурируйте автомобиль и получите точный расчёт стоимости под ключ с учётом
                  всех опций.
                </p>
                <div className="mb-4 text-2xl font-bold text-emerald-600">
                  от ${(estimatedBase + configuration.totalDelta).toLocaleString("en-US")}
                  {configuration.unpriced_options.length > 0 && (
                    <div className="text-sm font-normal text-muted-foreground">
                      + опции с уточняемой стоимостью
                    </div>
                  )}
                </div>
                <Button size="lg" onClick={() => setShowLeadForm(true)}>
                  Получить точный расчёт
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
