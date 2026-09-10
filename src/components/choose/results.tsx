"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ResultCard } from "./result-card";
import {
  RotateCcw,
  Send,
  CheckCircle2,
  Pencil,
  List,
  GitCompareArrows,
  AlertCircle,
  X,
} from "lucide-react";

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
  budgetFallback?: string;
  bodyType?: string;
  bodyTypeFallback?: string;
  powertrain?: string;
  powertrainFallback?: string;
  seats?: string;
  seatsFallback?: string;
  priority?: string;
  priorityFallback?: string;
  usage?: string;
  usageFallback?: string;
}

interface ResultsProps {
  answers: WizardAnswers;
  recommendations: Recommendation[];
  error?: string | null;
  loading?: boolean;
  onReset: () => void;
  onLeadForm: () => void;
  onRetry?: () => void;
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

function pluralizeVariants(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "вариант";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "варианта";
  return "вариантов";
}

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

export function ResultsSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="hidden h-9 w-48 sm:block" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <Skeleton className="aspect-[16/10] w-full rounded-xl sm:aspect-auto sm:h-44 sm:w-64" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/5" />
                  <div className="flex items-center justify-between pt-4">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Results({
  answers,
  recommendations,
  error,
  loading,
  onReset,
  onLeadForm,
  onRetry,
  onSoftenedFilter,
  onViewAll,
  onEditLastAnswer,
}: ResultsProps) {
  const [selectedCars, setSelectedCars] = useState<Set<string>>(new Set());

  const chosenOptions = Object.entries(answers)
    .filter(([key, value]) => value && value !== "any" && !key.endsWith("Fallback"))
    .map(([key, value]) => {
      const fallbackKey = `${key}Fallback` as keyof WizardAnswers;
      const fallback = answers[fallbackKey];
      const fallbackLabel = fallback && fallback !== "any" ? ANSWER_LABELS[key]?.[fallback] : null;
      return {
        title: ANSWER_TITLES[key] || key,
        label: ANSWER_LABELS[key]?.[value as string] || (value as string),
        fallbackLabel,
      };
    });

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
    <div className={cn(selectedCars.size >= 1 && "pb-28")}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ваши варианты</h2>
          <p className="text-muted-foreground">
            Найдено {recommendations.length}{" "}
            {pluralizeVariants(recommendations.length)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {error && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Не удалось обновить подборку</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} disabled={loading}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Попробовать снова
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {chosenOptions.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold">Ваши предпочтения</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {chosenOptions.map((opt) => (
                <Badge key={opt.title} variant="secondary" className="text-xs">
                  {opt.title}: {opt.label}
                  {opt.fallbackLabel && (
                    <span className="ml-1 text-muted-foreground"> / {opt.fallbackLabel}</span>
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className={cn("space-y-4 transition-opacity", loading && "pointer-events-none opacity-50")}>
        {recommendations.map((rec) => (
          <ResultCard
            key={rec.trimId}
            rec={rec}
            selected={selectedCars.has(rec.trimSlug)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      {recommendations.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              К сожалению, подходящих вариантов не найдено.
            </p>

            {getSoftenedFilters(answers).length > 0 && (
              <div className="mt-6">
                <p className="mb-3 text-sm text-muted-foreground">
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

      {selectedCars.size >= 1 && (
        <div className="fixed inset-x-4 bottom-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2">
          <Card className="shadow-soft-lg">
            <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <GitCompareArrows className="h-4 w-4 flex-shrink-0 text-brand" />
              {selectedCars.size >= 2 ? (
                <>
                  <span className="text-sm whitespace-nowrap text-muted-foreground">
                    Выбрано: {selectedCars.size} авто
                  </span>
                  <Link href={`/compare?cars=${Array.from(selectedCars).join(",")}`}>
                    <Button size="sm">Сравнить ({selectedCars.size})</Button>
                  </Link>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Выберите ещё авто для сравнения
                </span>
              )}
              <button
                type="button"
                onClick={() => setSelectedCars(new Set())}
                aria-label="Очистить выбор"
                className="ml-auto flex-shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
