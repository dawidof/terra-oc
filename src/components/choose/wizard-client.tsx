"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Results } from "./results";
import { LeadForm } from "./lead-form";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

interface WizardAnswers {
  budget?: string;
  bodyType?: string;
  powertrain?: string;
  seats?: string;
  priority?: string;
  usage?: string;
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
}

const STEPS = [
  {
    key: "budget",
    title: "Какой ваш бюджет?",
    subtitle: "Укажите примерный бюджет на автомобиль с доставкой",
    options: [
      { value: "under_35k", label: "До $35 000" },
      { value: "35k_45k", label: "$35 000 – $45 000" },
      { value: "45k_55k", label: "$45 000 – $55 000" },
      { value: "over_55k", label: "Свыше $55 000" },
      { value: "any", label: "Не важно" },
    ],
  },
  {
    key: "bodyType",
    title: "Какой тип кузова предпочитаете?",
    subtitle: "Выберите наиболее подходящий вариант",
    options: [
      { value: "sedan", label: "Седан" },
      { value: "suv", label: "Кроссовер / SUV" },
      { value: "liftback", label: "Лифтбек" },
      { value: "any", label: "Не важно" },
    ],
  },
  {
    key: "powertrain",
    title: "Какой тип привода?",
    subtitle: "Электромобиль или гибрид?",
    options: [
      { value: "bev", label: "Электро (BEV)" },
      { value: "phev", label: "Гибрид (PHEV)" },
      { value: "any", label: "Не важно" },
    ],
  },
  {
    key: "seats",
    title: "Сколько мест нужно?",
    subtitle: "Для перевозки семьи или пассажиров",
    options: [
      { value: "5", label: "5 мест" },
      { value: "7", label: "7 мест" },
      { value: "any", label: "Не важно" },
    ],
  },
  {
    key: "priority",
    title: "Что для вас важнее всего?",
    subtitle: "Выберите главный приоритет",
    options: [
      { value: "price", label: "Цена" },
      { value: "range", label: "Запас хода" },
      { value: "performance", label: "Динамика" },
      { value: "any", label: "Всё одинаково" },
    ],
  },
  {
    key: "usage",
    title: "Как будете использовать автомобиль?",
    subtitle: "Это поможет подобрать оптимальный вариант",
    options: [
      { value: "city", label: "В основном в городе" },
      { value: "family", label: "Для семьи" },
      { value: "long_distance", label: "Длинные поездки" },
      { value: "business", label: "Для бизнеса" },
    ],
  },
];

interface WizardClientProps {
  csrfToken: string;
}

export function WizardClient({ csrfToken }: WizardClientProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function handleSelect(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep.key]: value }));
  }

  async function handleShowResults() {
    setLoading(true);
    try {
      const res = await fetch("/api/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to get recommendations:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(0);
    setAnswers({});
    setRecommendations([]);
    setShowLeadForm(false);
  }

  // Show lead form
  if (showLeadForm) {
    return (
      <div className="mx-auto max-w-2xl">
        <LeadForm
          answers={answers}
          recommendations={recommendations}
          onBack={() => setShowLeadForm(false)}
          csrfToken={csrfToken}
        />
      </div>
    );
  }

  // Show results
  if (recommendations.length > 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <Results
          recommendations={recommendations}
          onReset={handleReset}
          onLeadForm={() => setShowLeadForm(true)}
        />
      </div>
    );
  }

  // Wizard steps
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
          <h2 className="mb-2 text-2xl font-bold">{currentStep.title}</h2>
          <p className="mb-6 text-muted-foreground">{currentStep.subtitle}</p>

          <div className="grid grid-cols-2 gap-3">
            {currentStep.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`rounded-lg border p-4 text-left transition-all ${
                  answers[currentStep.key as keyof WizardAnswers] === opt.value
                    ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
            disabled={!answers[currentStep.key as keyof WizardAnswers] || loading}
          >
            {loading ? "Подбор..." : "Показать результаты"}
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!answers[currentStep.key as keyof WizardAnswers]}
          >
            Далее
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
