"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, CheckCircle, ArrowLeft } from "lucide-react";

interface LeadFormAnswers {
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

interface LeadFormProps {
  answers: LeadFormAnswers;
  recommendations: any[];
  onBack: () => void;
  csrfToken: string;
}

export function LeadForm({ answers, recommendations, onBack, csrfToken }: LeadFormProps) {
  const searchParams = useSearchParams();
  const utmSource = searchParams.get("utm_source") || undefined;
  const utmMedium = searchParams.get("utm_medium") || undefined;
  const utmCampaign = searchParams.get("utm_campaign") || undefined;

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [preferredContact, setPreferredContact] = useState("phone");
  const [comment, setComment] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      setError("Введите корректный номер телефона");
      return;
    }

    setLoading(true);

    try {
      const metadata = {
        answers: {
          budget: answers.budget,
          budgetFallback: answers.budgetFallback,
          bodyType: answers.bodyType,
          bodyTypeFallback: answers.bodyTypeFallback,
          powertrain: answers.powertrain,
          powertrainFallback: answers.powertrainFallback,
          seats: answers.seats,
          seatsFallback: answers.seatsFallback,
          priority: answers.priority,
          priorityFallback: answers.priorityFallback,
          usage: answers.usage,
          usageFallback: answers.usageFallback,
        },
        recommendations: recommendations.map((r) => ({
          trimId: r.trimId,
          text: `${r.brandName} ${r.modelName} ${r.trimName}`,
          score: r.score,
          reasons: r.reasons || [],
        })),
        contact: {
          preferredContactMethod: preferredContact,
          telegram: telegram || undefined,
          comment: comment || undefined,
        },
      };

      const metadataComment = `<!--SELECTOR_DATA:${JSON.stringify(metadata)}-->`;

      const textLines = [
        `Бюджет: ${answers.budget || "—"}`,
        answers.budgetFallback && `Бюджет (альт): ${answers.budgetFallback}`,
        `Кузов: ${answers.bodyType || "—"}`,
        answers.bodyTypeFallback && `Кузов (альт): ${answers.bodyTypeFallback}`,
        `Привод: ${answers.powertrain || "—"}`,
        answers.powertrainFallback && `Привод (альт): ${answers.powertrainFallback}`,
        `Мест: ${answers.seats || "—"}`,
        answers.seatsFallback && `Мест (альт): ${answers.seatsFallback}`,
        `Приоритет: ${answers.priority || "—"}`,
        answers.priorityFallback && `Приоритет (альт): ${answers.priorityFallback}`,
        `Использование: ${answers.usage || "—"}`,
        answers.usageFallback && `Использование (альт): ${answers.usageFallback}`,
        `Рекомендации: ${recommendations.map((r) => `${r.brandName} ${r.modelName} ${r.trimName} (${r.score}%)`).join(", ")}`,
      ].filter(Boolean);

      const res = await fetch("/api/leads/selector", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          name,
          phone,
          telegram,
          preferredContactMethod: preferredContact,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
          comment: textLines.join("\n") + "\n\n" + metadataComment,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Не удалось отправить заявку. Попробуйте ещё раз.");
      }
    } catch (err) {
      setError("Ошибка сети. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-brand/25 bg-brand-muted">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <CheckCircle className="mb-4 h-12 w-12 text-brand" />
          <h3 className="mb-2 text-lg font-semibold">Заявка отправлена!</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Наш менеджер свяжется с вами для обсуждения деталей и подбора
            оптимального автомобиля.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Оставить заявку на подбор
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Мы подберём лучший вариант под ваши потребности
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 XX XXX XX XX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <Input
                id="telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username"
              />
            </div>
            <div className="space-y-2">
              <Label>Предпочтительная связь</Label>
              <Select
                value={preferredContact}
                onValueChange={(v) => v && setPreferredContact(v)}
                items={[
                  { value: "phone", label: "Телефон" },
                  { value: "telegram", label: "Telegram" },
                  { value: "whatsapp", label: "WhatsApp" },
                ]}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Телефон" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone" label="Телефон">Телефон</SelectItem>
                  <SelectItem value="telegram" label="Telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp" label="WhatsApp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий</Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительные пожелания..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Отправка..." : "Отправить заявку"}
            </Button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              политикой конфиденциальности
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
