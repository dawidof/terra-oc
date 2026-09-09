"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Results } from "./results";
import { LeadForm } from "./lead-form";
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Car,
  Zap,
  Users,
  TrendingDown,
  MapPin,
  Briefcase,
  Building2,
  Battery,
  Gauge,
  Route,
  HelpCircle,
  Banknote,
  Wallet,
  Truck,
  UserPlus,
  CircleDot,
  Circle,
  Shield,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WizardAnswers {
  budget?: { primary?: string; fallback?: string };
  bodyType?: { primary?: string; fallback?: string };
  powertrain?: { primary?: string; fallback?: string };
  seats?: { primary?: string; fallback?: string };
  priority?: { primary?: string; fallback?: string };
  usage?: { primary?: string; fallback?: string };
}

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

interface StepOption {
  value: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

interface Step {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  options: StepOption[];
}

const STEPS: Step[] = [
  {
    key: "budget",
    title: "Какой ваш бюджет?",
    subtitle: "Укажите примерный бюджет на автомобиль с доставкой",
    icon: DollarSign,
    options: [
      { value: "under_35k", label: "До $35 000", description: "Доступные модели", icon: Wallet },
      { value: "35k_45k", label: "$35 000 – $45 000", description: "Оптимальное соотношение", icon: Banknote },
      { value: "45k_55k", label: "$45 000 – $55 000", description: "Премиум сегмент", icon: DollarSign },
      { value: "over_55k", label: "Свыше $55 000", description: "Топовые комплектации", icon: Sparkles },
      { value: "any", label: "Не важно", description: "Показать все варианты", icon: HelpCircle },
    ],
  },
  {
    key: "bodyType",
    title: "Какой тип кузова предпочитаете?",
    subtitle: "Выберите основной вариант и запасной, если подходящего не найдётся",
    icon: Car,
    options: [
      { value: "sedan", label: "Седан", description: "Классический вариант", icon: Car },
      { value: "suv", label: "Кроссовер / SUV", description: "Высокая посадка", icon: Truck },
      { value: "liftback", label: "Лифтбек", description: "Седан с удобством хэтча", icon: Car },
      { value: "any", label: "Не важно", description: "Любой тип кузова", icon: Circle },
    ],
  },
  {
    key: "powertrain",
    title: "Какой тип привода?",
    subtitle: "Электромобиль или гибрид? Выберите основной и запасной вариант",
    icon: Zap,
    options: [
      { value: "bev", label: "Электро (BEV)", description: "Полностью электрический", icon: Battery },
      { value: "phev", label: "Гибрид (PHEV)", description: "Электро + бензин", icon: Zap },
      { value: "any", label: "Не важно", description: "Любой тип привода", icon: Circle },
    ],
  },
  {
    key: "seats",
    title: "Сколько мест нужно?",
    subtitle: "Для перевозки семьи или пассажиров",
    icon: Users,
    options: [
      { value: "5", label: "5 мест", description: "Стандартная компоновка", icon: Users },
      { value: "7", label: "7 мест", description: "Для большой семьи", icon: UserPlus },
      { value: "any", label: "Не важно", description: "Любое количество", icon: Circle },
    ],
  },
  {
    key: "priority",
    title: "Что для вас важнее всего?",
    subtitle: "Выберите главный приоритет и次要ный, если возможно",
    icon: TrendingDown,
    options: [
      { value: "price", label: "Цена", description: "Минимальная стоимость", icon: DollarSign },
      { value: "range", label: "Запас хода", description: "Максимальная дальность", icon: Route },
      { value: "performance", label: "Динамика", description: "Быстрый разгон", icon: Gauge },
      { value: "any", label: "Всё одинаково", description: "Без предпочтений", icon: Shield },
    ],
  },
  {
    key: "usage",
    title: "Как будете использовать автомобиль?",
    subtitle: "Это поможет подобрать оптимальный вариант",
    icon: MapPin,
    options: [
      { value: "city", label: "В основном в городе", description: "Короткие поездки", icon: Building2 },
      { value: "family", label: "Для семьи", description: "Поездки с детьми", icon: Users },
      { value: "long_distance", label: "Длинные поездки", description: "Междугородние рейсы", icon: Route },
      { value: "business", label: "Для бизнеса", description: "Представительский авто", icon: Briefcase },
    ],
  },
];

function getLastAnsweredStep(answers: WizardAnswers): number {
  const stepKeys = ["budget", "bodyType", "powertrain", "seats", "priority", "usage"];
  for (let i = stepKeys.length - 1; i >= 0; i--) {
    const key = stepKeys[i];
    const val = answers[key as keyof WizardAnswers];
    if (val?.primary && val.primary !== "any") {
      return i;
    }
  }
  return 0;
}

interface LeadFormAnswers {
  budget?: string;
  bodyType?: string;
  powertrain?: string;
  seats?: string;
  priority?: string;
  usage?: string;
}

interface WizardClientProps {
  csrfToken: string;
}

export function WizardClient({ csrfToken }: WizardClientProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const currentAnswer = answers[currentStep.key as keyof WizardAnswers];

  function handleSelect(value: string) {
    const current = answers[currentStep.key as keyof WizardAnswers];

    if (!current?.primary || current.primary === value) {
      // First click or re-selecting primary: set primary, clear fallback
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: { primary: value, fallback: undefined },
      }));
    } else if (current.fallback === value) {
      // Clicking fallback: deselect it
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: { ...current, fallback: undefined },
      }));
    } else {
      // Clicking a new option: set as fallback
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: { ...current, fallback: value },
      }));
    }
  }

  function getOptionState(optValue: string): "primary" | "fallback" | "none" {
    if (currentAnswer?.primary === optValue) return "primary";
    if (currentAnswer?.fallback === optValue) return "fallback";
    return "none";
  }

  function buildApiPayload(answers: WizardAnswers) {
    return {
      budget: answers.budget?.primary,
      budgetFallback: answers.budget?.fallback,
      bodyType: answers.bodyType?.primary,
      bodyTypeFallback: answers.bodyType?.fallback,
      powertrain: answers.powertrain?.primary,
      powertrainFallback: answers.powertrain?.fallback,
      seats: answers.seats?.primary,
      seatsFallback: answers.seats?.fallback,
      priority: answers.priority?.primary,
      priorityFallback: answers.priority?.fallback,
      usage: answers.usage?.primary,
      usageFallback: answers.usage?.fallback,
    };
  }

  async function handleShowResults() {
    setLoading(true);
    try {
      const res = await fetch("/api/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildApiPayload(answers)),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to get recommendations:", err);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setRecommendations([]);
    setShowLeadForm(false);
    setSubmitted(false);
  }

  function handleSoftenedFilter(key: string, value: string) {
    // For softened filters, update the primary and clear fallback for that key
    const newAnswers = {
      ...answers,
      [key]: { primary: value, fallback: undefined },
    };
    setAnswers(newAnswers);
    setLoading(true);
    fetch("/api/choose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildApiPayload(newAnswers)),
    })
      .then((res) => res.json())
      .then((data) => setRecommendations(data.recommendations || []))
      .catch((err) => console.error("Failed to get recommendations:", err))
      .finally(() => setLoading(false));
  }

  function handleViewAll() {
    const allAny: WizardAnswers = {
      budget: { primary: "any", fallback: undefined },
      bodyType: { primary: "any", fallback: undefined },
      powertrain: { primary: "any", fallback: undefined },
      seats: { primary: "any", fallback: undefined },
      priority: { primary: "any", fallback: undefined },
      usage: { primary: "any", fallback: undefined },
    };
    setAnswers(allAny);
    setLoading(true);
    fetch("/api/choose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildApiPayload(allAny)),
    })
      .then((res) => res.json())
      .then((data) => setRecommendations(data.recommendations || []))
      .catch((err) => console.error("Failed to get recommendations:", err))
      .finally(() => setLoading(false));
  }

  function handleEditLastAnswer() {
    const lastStep = getLastAnsweredStep(answers);
    setStep(lastStep);
    setSubmitted(false);
  }

  // Show lead form
  if (showLeadForm) {
    return (
      <div className="mx-auto max-w-2xl">
        <LeadForm
          answers={buildApiPayload(answers) as LeadFormAnswers}
          recommendations={recommendations}
          onBack={() => setShowLeadForm(false)}
          csrfToken={csrfToken}
        />
      </div>
    );
  }

  // Show results
  if (submitted) {
    return (
      <div className="mx-auto max-w-4xl">
        <Results
          answers={buildApiPayload(answers) as LeadFormAnswers}
          recommendations={recommendations}
          onReset={handleReset}
          onLeadForm={() => setShowLeadForm(true)}
          onSoftenedFilter={handleSoftenedFilter}
          onViewAll={handleViewAll}
          onEditLastAnswer={handleEditLastAnswer}
        />
      </div>
    );
  }

  const StepIcon = currentStep.icon;
  const hasPrimary = currentAnswer?.primary != null;
  const hasFallback = currentAnswer?.fallback != null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <p className="mt-2 text-right text-sm text-muted-foreground">
          Шаг {step + 1} из {STEPS.length}
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          {/* Step header with icon */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentStep.title}</h2>
              <p className="text-muted-foreground">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Priority hint */}
          {currentStep.options.length > 2 && (
            <div className="mb-4 rounded-lg bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
              Нажмите один раз — основной выбор. Нажмите второй — запасной вариант.
            </div>
          )}

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-3">
            {currentStep.options.map((opt) => {
              const state = getOptionState(opt.value);
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`relative flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                    state === "primary"
                      ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                      : state === "fallback"
                        ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-300"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {/* Priority badge */}
                  {state !== "none" && (
                    <span
                      className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                        state === "primary" ? "bg-emerald-600" : "bg-emerald-400"
                      }`}
                    >
                      {state === "primary" ? "1" : "2"}
                    </span>
                  )}

                  <div
                    className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                      state === "primary"
                        ? "bg-emerald-200 text-emerald-700"
                        : state === "fallback"
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-medium ${
                        state !== "none" ? "text-emerald-900" : "text-foreground"
                      }`}
                    >
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {opt.description}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected summary */}
          {(hasPrimary || hasFallback) && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <CircleDot className="h-3.5 w-3.5" />
              {hasPrimary && (
                <span>
                  Основной:{" "}
                  <span className="font-medium text-emerald-700">
                    {currentStep.options.find((o) => o.value === currentAnswer?.primary)?.label}
                  </span>
                </span>
              )}
              {hasFallback && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>
                    Запасной:{" "}
                    <span className="font-medium text-emerald-500">
                      {currentStep.options.find((o) => o.value === currentAnswer?.fallback)?.label}
                    </span>
                  </span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Назад
        </Button>

        {step === STEPS.length - 1 ? (
          <Button
            onClick={handleShowResults}
            disabled={!hasPrimary || loading}
          >
            {loading ? "Подбор..." : "Показать результаты"}
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!hasPrimary}
          >
            Далее
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
