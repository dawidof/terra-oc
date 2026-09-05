"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResultCard } from "./result-card";
import { RotateCcw, Send, CheckCircle2, Pencil, List, GitCompareArrows } from "lucide-react";

interface Recommendation {
  trimId: string;
  trimName: string;
  modelName: string;
  brandName: string;
  trimSlug: string;
  bodyType: string | null;
  powertrainType: string | null;
  rangeKm: number | null;
  acceleration0100: string | null;
  estimatedTotalUsd: string | null;
  score: number;
  reasons: string[];
  imageUrl: string | null;
}

interface WizardAnswers {
  budget?: string;
  bodyType?: string;
  powertrain?: string;
  seats?: string;
  priority?: string;
  usage?: string;
}

interface ResultsProps {
  answers: WizardAnswers;
  recommendations: Recommendation[];
  onReset: () => void;
  onLeadForm: () => void;
  onSoftenedFilter?: (key: string, value: string) => void;
  onViewAll?: () => void;
  onEditLastAnswer?: () => void;
}

const ANSWER_LABELS: Record<string, Record<string, string>> = {
  budget: {
    under_35k: "До $35 000",
    "35k_45k": "$35 000 – $45 000",
    "45k_55k": "$45 000 – $55 000",
    over_55k: "Свыше $55 000",
    any: "Любой бюджет",
  },
  bodyType: {
    sedan: "Седан",
    suv: "Кроссовер / SUV",
    liftback: "Лифтбек",
    any: "Любой тип",
  },
  powertrain: {
    bev: "Электро (BEV)",
    phev: "Гибрид (PHEV)",
    any: "Любой тип привода",
  },
  seats: {
    "5": "5 мест",
    "7": "7 мест",
    any: "Любое кол-во мест",
  },
  priority: {
    price: "Цена",
    range: "Запас хода",
    performance: "Динамика",
    any: "Всё одинаково",
  },
  usage: {
    city: "В городе",
    family: "Для семьи",
    long_distance: "Длинные поездки",
    business: "Для бизнеса",
  },
};

const ANSWER_TITLES: Record<string, string> = {
  budget: "Бюджет",
  bodyType: "Кузов",
  powertrain: "Привод",
  seats: "Места",
  priority: "Приоритет",
  usage: "Использование",
};

function getSoftenedFilters(answers: WizardAnswers): Array<{ key: string; label: string }> {
  const filters: Array<{ key: string; label: string }> = [];

  if (answers.budget && answers.budget !== "any") {
    const labels: Record<string, string> = {
      under_35k: "Расширить бюджет",
      "35k_45k": "Расширить бюджет",
      "45k_55k": "Расширить бюджет до $55k+",
    };
    if (labels[answers.budget]) {
      filters.push({ key: "budget", label: labels[answers.budget] });
    }
  }

  if (answers.bodyType && answers.bodyType !== "any") {
    filters.push({ key: "bodyType", label: "Любой тип кузова" });
  }

  if (answers.powertrain && answers.powertrain !== "any") {
    filters.push({ key: "powertrain", label: "Любой тип привода" });
  }

  if (answers.seats && answers.seats !== "any") {
    filters.push({ key: "seats", label: "Любое кол-во мест" });
  }

  return filters;
}

export function Results({ answers, recommendations, onReset, onLeadForm, onSoftenedFilter, onViewAll, onEditLastAnswer }: ResultsProps) {
  const [selectedCars, setSelectedCars] = useState<Set<string>>(new Set());

  const chosenOptions = Object.entries(answers)
    .filter(([, value]) => value && value !== "any")
    .map(([key, value]) => ({
      title: ANSWER_TITLES[key] || key,
      label: ANSWER_LABELS[key]?.[value!] || value!,
    }));

  function handleToggleSelect(trimSlug: string) {
    setSelectedCars((prev) => {
      const next = new Set(prev);
      if (next.has(trimSlug)) {
        next.delete(trimSlug);
      } else {
        next.add(trimSlug);
      }
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ваши варианты</h2>
          <p className="text-muted-foreground">
            Найдено {recommendations.length} {recommendations.length === 1 ? "вариант" : "вариантов"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Начать заново
          </Button>
          <Button onClick={onLeadForm}>
            <Send className="mr-1 h-4 w-4" />
            Оставить заявку
          </Button>
        </div>
      </div>

      {/* Chosen options summary */}
      {chosenOptions.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-semibold">Ваши предпочтения</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {chosenOptions.map((opt) => (
                <Badge key={opt.title} variant="secondary" className="text-xs">
                  {opt.title}: {opt.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <ResultCard
            key={rec.trimId}
            rec={rec}
            onLeadForm={onLeadForm}
            selected={selectedCars.has(rec.trimSlug)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      {/* Floating compare button */}
      {selectedCars.size >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-lg">
            <CardContent className="flex items-center gap-4 p-4">
              <span className="text-sm text-muted-foreground">
                Выбрано: {selectedCars.size} авто
              </span>
              <Link href={`/compare?cars=${Array.from(selectedCars).join(",")}`}>
                <Button>
                  <GitCompareArrows className="mr-2 h-4 w-4" />
                  Сравнить ({selectedCars.size})
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              К сожалению, подходящих вариантов не найдено.
            </p>

            {/* Soften filters */}
            {getSoftenedFilters(answers).length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Возможно, слишком строгие фильтры. Попробуйте:
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {getSoftenedFilters(answers).map((filter) => (
                    <Button
                      key={filter.key}
                      variant="outline"
                      size="sm"
                      onClick={() => onSoftenedFilter?.(filter.key, "any")}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={onEditLastAnswer}>
                <Pencil className="mr-1 h-4 w-4" />
                Изменить последний ответ
              </Button>
              <Button variant="outline" onClick={onViewAll}>
                <List className="mr-1 h-4 w-4" />
                Посмотреть все варианты
              </Button>
              <Button variant="outline" onClick={onReset}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Начать заново
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
