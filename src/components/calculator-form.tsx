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
import { Separator } from "@/components/ui/separator";
import { Calculator, Info } from "lucide-react";

interface CalculationResult {
  vehiclePrice: number;
  logistics: number;
  customsDuty: number;
  exciseTax: number;
  vat: number;
  certificationFees: number;
  serviceFee: number;
  total: number;
  exchangeRate: number;
  formulaVersion: string;
}

interface CalculatorFormProps {
  initialCountry?: string;
  initialCondition?: string;
  initialPrice?: number;
  initialPowertrain?: string;
  initialDisplacement?: number;
  initialPower?: number;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}

export function CalculatorForm({
  initialCountry = "Китай",
  initialCondition = "new",
  initialPrice,
  initialPowertrain = "bev",
  initialDisplacement,
  initialPower,
}: CalculatorFormProps) {
  const [mode, setMode] = useState<"catalog" | "manual">(initialPrice ? "catalog" : "manual");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sourceCountry, setSourceCountry] = useState(initialCountry);
  const [condition, setCondition] = useState(initialCondition);
  const [purchasePrice, setPurchasePrice] = useState(initialPrice?.toString() || "");
  const [currency, setCurrency] = useState("USD");
  const [powertrain, setPowertrain] = useState(initialPowertrain);
  const [displacement, setDisplacement] = useState(initialDisplacement?.toString() || "");
  const [power, setPower] = useState(initialPower?.toString() || "");

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceCountry,
          condition,
          purchasePrice: Number(purchasePrice),
          currency,
          powertrain,
          engineDisplacementCc: displacement ? Number(displacement) : undefined,
          enginePowerHp: power ? Number(power) : undefined,
        }),
      });

      const data = await res.json();
      if (data.breakdown) {
        setResult(data.breakdown);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError("Ошибка при расчёте. Проверьте параметры и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Параметры автомобиля
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-4">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => setMode("manual")}
              >
                Вручную
              </Button>
              <Button
                type="button"
                variant={mode === "catalog" ? "default" : "outline"}
                onClick={() => setMode("catalog")}
              >
                Из каталога
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Страна отправления</Label>
                <Select value={sourceCountry} onValueChange={(v) => v && setSourceCountry(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Китай">Китай</SelectItem>
                    <SelectItem value="Корея">Корея</SelectItem>
                    <SelectItem value="США">США</SelectItem>
                    <SelectItem value="ОАЭ">ОАЭ (Дубай)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Состояние</Label>
                <Select value={condition} onValueChange={(v) => v && setCondition(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="used">С пробегом</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена покупки ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="35000"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CNY">CNY (Юань)</SelectItem>
                    <SelectItem value="KRW">KRW (Вона)</SelectItem>
                    <SelectItem value="AED">AED (Дирхам)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="powertrain">Тип привода</Label>
                <Select value={powertrain} onValueChange={(v) => v && setPowertrain(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bev">Электро (BEV)</SelectItem>
                    <SelectItem value="phev">Гибрид (PHEV)</SelectItem>
                    <SelectItem value="hev">Гибрид (HEV)</SelectItem>
                    <SelectItem value="petrol">Бензин</SelectItem>
                    <SelectItem value="diesel">Дизель</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displacement">Объём двигателя (см³)</Label>
                <Input
                  id="displacement"
                  type="number"
                  placeholder="2000"
                  value={displacement}
                  onChange={(e) => setDisplacement(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="power">Мощность (л.с. / кВт)</Label>
              <Input
                id="power"
                type="number"
                placeholder="250"
                value={power}
                onChange={(e) => setPower(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Расчёт..." : "Рассчитать стоимость"}
            </Button>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        {result ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Ориентировочная стоимость под ключ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Стоимость автомобиля</span>
                  <span className="font-medium">{formatCurrency(result.vehiclePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Логистика</span>
                  <span className="font-medium">{formatCurrency(result.logistics)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Таможенные платежи</span>
                  <span className="font-medium">{formatCurrency(result.customsDuty)}</span>
                </div>
                {result.exciseTax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Акцизный налог</span>
                    <span className="font-medium">{formatCurrency(result.exciseTax)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">НДС (12%)</span>
                  <span className="font-medium">{formatCurrency(result.vat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Сертификация / оформление</span>
                  <span className="font-medium">{formatCurrency(result.certificationFees)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Услуги компании</span>
                  <span className="font-medium">{formatCurrency(result.serviceFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Итого ориентировочно</span>
                  <span className="text-emerald-600">{formatCurrency(result.total)}</span>
                </div>
                {result.exchangeRate > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ≈ {(result.total * result.exchangeRate).toLocaleString("uz-UZ")} UZS
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex gap-3 p-4">
                <Info className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Расчёт носит ориентировочный характер. Итоговая стоимость зависит от фактической
                  цены автомобиля, курса валют, стоимости логистики и действующих на дату оформления
                  таможенных платежей.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <p className="mb-3 text-muted-foreground">Нужен точный расчёт?</p>
                <Link href="/choose">
                  <Button size="lg" className="w-full">
                    Получить точный расчёт
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <Calculator className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Введите параметры</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Укажите страну отправления, цену и тип автомобиля, чтобы увидеть ориентировочную
              стоимость под ключ в Узбекистане.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
