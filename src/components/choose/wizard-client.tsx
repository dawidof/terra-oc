"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Results, ResultsSkeleton } from "./results";
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
  AlertCircle,
  RotateCcw,
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
  icon: LucideIcon;
  options: StepOption[];
}

const STEPS: Step[] = [
  {
    key: "budget",
    title: "Какой ваш бюджет?",
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
    icon: MapPin,
    options: [
      { value: "city", label: "В основном в городе", description: "Короткие поездки", icon: Building2 },
      { value: "family", label: "Для семьи", description: "Поездки с детьми", icon: Users },
      { value: "long_distance", label: "Длинные поездки", description: "Междугородние рейсы", icon: Route },
      { value: "business", label: "Для бизнеса", description: "Представительский авто", icon: Briefcase },
    ],
  },
];

const STORAGE_KEY = "choose-wizard-state";

interface PersistedState {
  step: number;
  maxStep: number;
  answers: WizardAnswers;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as PersistedState;
    if (!saved || typeof saved.step !== "number" || !saved.answers) return null;
    return {
      step: Math.min(Math.max(saved.step, 0), STEPS.length - 1),
      maxStep: Math.min(Math.max(saved.maxStep ?? saved.step, 0), STEPS.length - 1),
      answers: saved.answers,
    };
  } catch {
    return null;
  }
}

function persist(state: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
}

function clearPersisted() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

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

function FetchErrorCard({ message, onRetry, loading }: { message: string; onRetry: () => void; loading: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-semibold">Не удалось загрузить результаты</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
        </div>
        <Button onClick={onRetry} disabled={loading}>
          <RotateCcw className="mr-1 h-4 w-4" />
          {loading ? "Повтор..." : "Попробовать снова"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function WizardClient() {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = loadPersisted();
    if (saved) {
      setStep(saved.step);
      setMaxStep(saved.maxStep);
      setAnswers(saved.answers);
    }
  }, []);

  useEffect(() => {
    if (!submitted) {
      persist({ step, maxStep, answers });
    }
  }, [step, maxStep, answers, submitted]);

  const currentStep = STEPS[step];
  const currentAnswer = answers[currentStep.key as keyof WizardAnswers];

  function goToStep(next: number) {
    setDirection(next >= step ? 1 : -1);
    setStep(next);
    setMaxStep((m) => Math.max(m, next));
  }

  function handleSelect(value: string) {
    const current = answers[currentStep.key as keyof WizardAnswers];

    if (current?.primary === value && current?.fallback) {
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: { primary: current.fallback, fallback: undefined },
      }));
    } else if (current?.primary === value) {
      // already primary with no fallback — do nothing
    } else if (current?.fallback === value) {
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: { ...current, fallback: undefined },
      }));
    } else if (!current?.primary) {
      setAnswers((prev) => ({
        ...prev,
        [currentStep.key]: { primary: value, fallback: undefined },
      }));
    } else {
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

  async function fetchRecommendations(payload: WizardAnswers) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildApiPayload(payload)),
      });
      if (!res.ok) {
        setError(
          res.status === 429
            ? "Слишком много запросов. Подождите минуту и попробуйте снова."
            : "Сервис подбора временно недоступен. Попробуйте ещё раз."
        );
        return;
      }
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {
      setError("Ошибка сети. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShowResults() {
    setSubmitted(true);
    clearPersisted();
    await fetchRecommendations(answers);
  }

  function handleReset() {
    clearPersisted();
    setStep(0);
    setMaxStep(0);
    setDirection(1);
    setAnswers({});
    setRecommendations([]);
    setError(null);
    setShowLeadForm(false);
    setSubmitted(false);
  }

  function handleSoftenedFilter(key: string, value: string) {
    const newAnswers = {
      ...answers,
      [key]: { primary: value, fallback: undefined },
    };
    setAnswers(newAnswers);
    void fetchRecommendations(newAnswers);
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
    void fetchRecommendations(allAny);
  }

  function handleEditLastAnswer() {
    const lastStep = getLastAnsweredStep(answers);
    setDirection(-1);
    setStep(lastStep);
    setMaxStep((m) => Math.max(m, lastStep));
    setSubmitted(false);
  }

  if (showLeadForm) {
    return (
      <div className="mx-auto max-w-2xl">
        <LeadForm
          answers={buildApiPayload(answers) as LeadFormAnswers}
          recommendations={recommendations}
          onBack={() => setShowLeadForm(false)}
        />
      </div>
    );
  }

  if (submitted) {
    if (loading && recommendations.length === 0 && !error) {
      return (
        <div className="mx-auto max-w-4xl">
          <ResultsSkeleton />
        </div>
      );
    }

    if (error && recommendations.length === 0) {
      return (
        <div className="mx-auto max-w-4xl">
          <FetchErrorCard
            message={error}
            onRetry={() => void fetchRecommendations(answers)}
            loading={loading}
          />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl">
        <Results
          answers={buildApiPayload(answers) as LeadFormAnswers}
          recommendations={recommendations}
          error={error}
          loading={loading}
          onRetry={() => void fetchRecommendations(answers)}
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
      <div className="mb-4 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-label="Шаги подбора">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => i <= maxStep && i !== step && goToStep(i)}
              disabled={i > maxStep}
              title={s.title}
              aria-label={`Шаг ${i + 1}: ${s.title}`}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "h-2 flex-1 rounded-full transition-all duration-300",
                i === step
                  ? "bg-brand"
                  : i <= maxStep
                    ? "cursor-pointer bg-brand/40 hover:bg-brand/70"
                    : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs whitespace-nowrap text-muted-foreground">
          Шаг {step + 1} / {STEPS.length}
        </p>
      </div>

      <div
        key={step}
        className={cn(
          "animate-in fade-in duration-300",
          direction === 1 ? "slide-in-from-right-4" : "slide-in-from-left-4"
        )}
      >
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-muted text-brand">
                <StepIcon className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                {currentStep.title}
              </h2>
            </div>

            {currentStep.options.length > 2 && (
              <div className="mb-3 rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
                Нажмите один раз — основной выбор. Нажмите второй — запасной вариант.
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentStep.options.map((opt) => {
                const state = getOptionState(opt.value);
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "relative flex items-start gap-3 rounded-xl border p-3 text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
                      state === "primary"
                        ? "border-brand bg-brand-muted ring-1 ring-brand"
                        : state === "fallback"
                          ? "border-brand/50 bg-brand-muted/50 ring-1 ring-brand/40"
                          : "border-border hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-muted hover:shadow-soft"
                    )}
                  >
                    {state !== "none" && (
                      <span
                        className={cn(
                          "absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                          state === "primary" ? "bg-brand" : "bg-brand/60"
                        )}
                      >
                        {state === "primary" ? "1" : "2"}
                      </span>
                    )}

                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg",
                        state === "primary"
                          ? "bg-brand text-white"
                          : state === "fallback"
                            ? "bg-brand-muted text-brand"
                            : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-sm font-medium text-foreground",
                          state !== "none" ? "font-semibold" : ""
                        )}
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

            {(hasPrimary || hasFallback) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CircleDot className="h-3.5 w-3.5" />
                {hasPrimary && (
                  <span>
                    Основной:{" "}
                    <span className="font-medium text-brand">
                      {currentStep.options.find((o) => o.value === currentAnswer?.primary)?.label}
                    </span>
                  </span>
                )}
                {hasFallback && (
                  <>
                    <span className="text-border">·</span>
                    <span>
                      Запасной:{" "}
                      <span className="font-medium text-brand/70">
                        {currentStep.options.find((o) => o.value === currentAnswer?.fallback)?.label}
                      </span>
                    </span>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={() => goToStep(step - 1)} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>

          {step === STEPS.length - 1 ? (
            <Button
              onClick={handleShowResults}
              disabled={!hasPrimary}
              className="bg-brand text-brand-foreground shadow-sm hover:bg-brand-deep"
            >
              Показать результаты
            </Button>
          ) : (
            <Button
              onClick={() => goToStep(step + 1)}
              disabled={!hasPrimary}
              className="bg-brand text-brand-foreground shadow-sm hover:bg-brand-deep"
            >
              Далее
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
