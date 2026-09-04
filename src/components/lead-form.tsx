"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Send, CheckCircle } from "lucide-react";

interface LeadFormProps {
  vehicleName: string;
  estimatedTotal: number | null;
  configuration: {
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options: string[];
    unpriced_options: string[];
    totalDelta: number;
  };
  trimId: string;
  brandName: string;
  modelName: string;
  trimName: string;
  sourceCountry: string;
  condition: string;
  sourcePrice: number;
}

export function LeadForm({
  vehicleName,
  estimatedTotal,
  configuration,
  trimId,
  brandName,
  modelName,
  trimName,
  sourceCountry,
  condition,
  sourcePrice,
}: LeadFormProps) {
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

    // Phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      setError("Введите корректный номер телефона");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          telegram,
          preferredContactMethod: preferredContact,
          trimId,
          brandName,
          modelName,
          trimName,
          sourceCountry,
          condition,
          configurationJson: configuration,
          sourcePrice,
          estimatedTotal: estimatedTotal
            ? estimatedTotal + configuration.totalDelta
            : null,
          currency: "USD",
          source: "configurator",
          comment,
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
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex flex-col items-center py-8 text-center">
          <CheckCircle className="mb-4 h-12 w-12 text-emerald-600" />
          <h3 className="mb-2 text-lg font-semibold">Заявка отправлена!</h3>
          <p className="text-sm text-muted-foreground">
            Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.
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
          Оставить заявку
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {vehicleName}
          {estimatedTotal && (
            <span className="ml-2 font-medium text-emerald-600">
              от ${(estimatedTotal + configuration.totalDelta).toLocaleString("en-US")}
            </span>
          )}
          {configuration.unpriced_options.length > 0 && (
            <span className="ml-2 text-xs">
              + опции с уточняемой стоимостью
            </span>
          )}
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
              <Label htmlFor="contact">Предпочтительная связь</Label>
              <Select value={preferredContact} onValueChange={(v) => v && setPreferredContact(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Телефон</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
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
              placeholder="Ваши пожелания или вопросы..."
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              rows={3}
            />
          </div>

          {/* Configuration summary */}
          {(configuration.exterior_color || configuration.interior_color || configuration.wheels || configuration.options.length > 0) && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <div className="mb-1 font-medium">Ваша конфигурация:</div>
              <div className="space-y-1 text-muted-foreground">
                {configuration.exterior_color && <div>Кузов: {configuration.exterior_color}</div>}
                {configuration.interior_color && <div>Салон: {configuration.interior_color}</div>}
                {configuration.wheels && <div>Колёса: {configuration.wheels}</div>}
                {configuration.options.length > 0 && (
                  <div>Доп. опции: {configuration.options.join(", ")}</div>
                )}
                {configuration.unpriced_options.length > 0 && (
                  <div className="text-amber-600">
                    Цена уточняется: {configuration.unpriced_options.join(", ")}
                  </div>
                )}
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Отправка..." : "Получить точный расчёт"}
          </Button>

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
