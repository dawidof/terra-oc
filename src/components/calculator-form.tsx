"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Calculator, Info, Search, X, Send, CheckCircle } from "lucide-react";

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

interface CatalogTrim {
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  basePrice: number | null;
  basePriceCurrency: string | null;
  powertrainType: string | null;
  engineDisplacementCc: number | null;
  motorPowerKw: number | null;
  batteryCapacityKwh: number | null;
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
  return `$${Math.round(amount).toLocaleString("ru-RU")}`;
}

const EV_POWERTRAINS = ["bev", "phev", "reev"];

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

  // Common fields
  const [sourceCountry, setSourceCountry] = useState(initialCountry);
  const [condition, setCondition] = useState(initialCondition);

  // Manual mode fields
  const [purchasePrice, setPurchasePrice] = useState(initialPrice?.toString() || "");
  const [currency, setCurrency] = useState("USD");
  const [powertrain, setPowertrain] = useState(initialPowertrain);
  const [displacement, setDisplacement] = useState(initialDisplacement?.toString() || "");
  const [power, setPower] = useState(initialPower?.toString() || "");

  // Catalog mode fields
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogTrim[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedTrim, setSelectedTrim] = useState<CatalogTrim | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lead form state
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadTelegram, setLeadTelegram] = useState("");
  const [leadPreferredContact, setLeadPreferredContact] = useState("phone");
  const [leadComment, setLeadComment] = useState("");

  const isEv = EV_POWERTRAINS.includes(powertrain);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCatalog = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCatalogResults([]);
      return;
    }
    setCatalogLoading(true);
    try {
      const res = await fetch(`/api/search-trims?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCatalogResults(data.trims || []);
      setShowDropdown(true);
    } catch {
      setCatalogResults([]);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  function handleCatalogSearch(value: string) {
    setCatalogQuery(value);
    setSelectedTrim(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCatalog(value), 300);
  }

  function selectCatalogTrim(trim: CatalogTrim) {
    setSelectedTrim(trim);
    setCatalogQuery(`${trim.brandName} ${trim.modelName} — ${trim.trimName}`);
    setShowDropdown(false);

    // Auto-fill fields from catalog data
    if (trim.basePrice) {
      setPurchasePrice(trim.basePrice.toString());
    }
    if (trim.basePriceCurrency) {
      setCurrency(trim.basePriceCurrency);
    }
    if (trim.powertrainType) {
      setPowertrain(trim.powertrainType);
    }
    if (trim.engineDisplacementCc) {
      setDisplacement(trim.engineDisplacementCc.toString());
    } else {
      setDisplacement("");
    }
    if (trim.motorPowerKw) {
      setPower(trim.motorPowerKw.toString());
    } else {
      setPower("");
    }
  }

  function clearCatalogSelection() {
    setSelectedTrim(null);
    setCatalogQuery("");
    setCatalogResults([]);
    setPurchasePrice("");
    setCurrency("USD");
    setPowertrain(initialPowertrain);
    setDisplacement("");
    setPower("");
  }

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isElectric = EV_POWERTRAINS.includes(powertrain);

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
          engineDisplacementCc: !isElectric && displacement ? Number(displacement) : undefined,
          ...(isElectric
            ? { motorPowerKw: power ? Number(power) : undefined }
            : { enginePowerHp: power ? Number(power) : undefined }),
          trimId: selectedTrim?.trimId,
        }),
      });

      const data = await res.json();
      if (data.breakdown) {
        setResult(data.breakdown);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("Ошибка при расчёте. Проверьте параметры и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid =
    purchasePrice &&
    Number(purchasePrice) > 0 &&
    (mode === "manual" || selectedTrim);

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError(null);

    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(leadPhone)) {
      setLeadError("Введите корректный номер телефона");
      return;
    }

    setLeadLoading(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          telegram: leadTelegram || undefined,
          preferredContactMethod: leadPreferredContact,
          sourceCountry,
          condition,
          trimId: selectedTrim?.trimId,
          brandName: selectedTrim?.brandName || "Ручной ввод",
          modelName: selectedTrim?.modelName || powertrain.toUpperCase(),
          trimName: selectedTrim?.trimName || undefined,
          sourcePrice: Number(purchasePrice),
          estimatedTotal: result?.total,
          currency: "USD",
          source: "calculator",
          comment: leadComment || undefined,
          logisticsCost: result?.logistics,
          customsCost: result?.customsDuty,
          serviceFee: result?.serviceFee,
          configurationJson: {
            calculatorBreakdown: result ? {
              vehiclePrice: result.vehiclePrice,
              logistics: result.logistics,
              customsDuty: result.customsDuty,
              exciseTax: result.exciseTax,
              vat: result.vat,
              certificationFees: result.certificationFees,
              serviceFee: result.serviceFee,
              total: result.total,
            } : undefined,
          },
        }),
      });

      if (res.ok) {
        setLeadSubmitted(true);
      } else {
        setLeadError("Не удалось отправить заявку. Попробуйте ещё раз.");
      }
    } catch {
      setLeadError("Ошибка сети. Проверьте подключение и попробуйте ещё раз.");
    } finally {
      setLeadLoading(false);
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
                onClick={() => {
                  setMode("manual");
                  clearCatalogSelection();
                }}
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
                <Select
                  value={sourceCountry}
                  onValueChange={(v) => v && setSourceCountry(v)}
                  items={[
                    { value: "Китай", label: "Китай" },
                    { value: "Корея", label: "Корея" },
                    { value: "США", label: "США" },
                    { value: "ОАЭ", label: "ОАЭ (Дубай)" },
                  ]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Страна" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Китай" label="Китай">Китай</SelectItem>
                    <SelectItem value="Корея" label="Корея">Корея</SelectItem>
                    <SelectItem value="США" label="США">США</SelectItem>
                    <SelectItem value="ОАЭ" label="ОАЭ (Дубай)">ОАЭ (Дубай)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Состояние</Label>
                <Select
                  value={condition}
                  onValueChange={(v) => v && setCondition(v)}
                  items={[
                    { value: "new", label: "Новый автомобиль" },
                    { value: "used", label: "С пробегом" },
                  ]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Состояние" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" label="Новый автомобиль">Новый автомобиль</SelectItem>
                    <SelectItem value="used" label="С пробегом">С пробегом</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Catalog mode: search input */}
            {mode === "catalog" && (
              <div className="space-y-2" ref={dropdownRef}>
                <Label>Автомобиль из каталога</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Начните вводить марку или модель..."
                    value={catalogQuery}
                    onChange={(e) => handleCatalogSearch(e.target.value)}
                    onFocus={() => catalogResults.length > 0 && setShowDropdown(true)}
                    className="pl-9 pr-9"
                  />
                  {catalogQuery && (
                    <button
                      type="button"
                      onClick={clearCatalogSelection}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {showDropdown && catalogResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto">
                      {catalogResults.map((trim) => (
                        <button
                          key={trim.trimId}
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                          onClick={() => selectCatalogTrim(trim)}
                        >
                          <span className="font-medium">
                            {trim.brandName} {trim.modelName}
                          </span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {trim.trimName}
                            {trim.basePrice ? ` · $${trim.basePrice.toLocaleString("ru-RU")}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && catalogResults.length === 0 && !catalogLoading && catalogQuery.length >= 2 && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md px-3 py-2 text-sm text-muted-foreground">
                      Ничего не найдено
                    </div>
                  )}
                </div>
                {catalogLoading && (
                  <p className="text-xs text-muted-foreground">Поиск...</p>
                )}
                {selectedTrim && (
                  <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                    <p className="font-medium">
                      {selectedTrim.brandName} {selectedTrim.modelName}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedTrim.trimName}
                      {selectedTrim.powertrainType && ` · ${selectedTrim.powertrainType.toUpperCase()}`}
                      {selectedTrim.motorPowerKw && ` · ${selectedTrim.motorPowerKw} кВт`}
                      {selectedTrim.engineDisplacementCc && ` · ${selectedTrim.engineDisplacementCc} см³`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Manual mode: price + currency */}
            {mode === "manual" && (
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
                <Select
                  value={currency}
                  onValueChange={(v) => v && setCurrency(v)}
                  items={[
                    { value: "USD", label: "USD" },
                    { value: "CNY", label: "CNY (Юань)" },
                    { value: "KRW", label: "KRW (Вона)" },
                    { value: "AED", label: "AED (Дирхам)" },
                  ]}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Валюта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD" label="USD">USD</SelectItem>
                    <SelectItem value="CNY" label="CNY (Юань)">CNY (Юань)</SelectItem>
                    <SelectItem value="KRW" label="KRW (Вона)">KRW (Вона)</SelectItem>
                    <SelectItem value="AED" label="AED (Дирхам)">AED (Дирхам)</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>
            )}

            {/* Catalog mode: show auto-filled price (read-only) */}
            {mode === "catalog" && selectedTrim && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Цена покупки</Label>
                  <Input
                    type="text"
                    value={purchasePrice ? `$${Number(purchasePrice).toLocaleString("ru-RU")}` : ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Валюта</Label>
                  <Input type="text" value={currency} readOnly className="bg-muted" />
                </div>
              </div>
            )}

            {/* Manual mode: powertrain + displacement + power */}
            {mode === "manual" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="powertrain">Тип привода</Label>
                    <Select
                      value={powertrain}
                      onValueChange={(v) => v && setPowertrain(v)}
                      items={[
                        { value: "bev", label: "Электро (BEV)" },
                        { value: "phev", label: "Гибрид (PHEV)" },
                        { value: "hev", label: "Гибрид (HEV)" },
                        { value: "petrol", label: "Бензин" },
                        { value: "diesel", label: "Дизель" },
                      ]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Тип привода" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bev" label="Электро (BEV)">Электро (BEV)</SelectItem>
                        <SelectItem value="phev" label="Гибрид (PHEV)">Гибрид (PHEV)</SelectItem>
                        <SelectItem value="hev" label="Гибрид (HEV)">Гибрид (HEV)</SelectItem>
                        <SelectItem value="petrol" label="Бензин">Бензин</SelectItem>
                        <SelectItem value="diesel" label="Дизель">Дизель</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!isEv && (
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
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="power">
                    {isEv ? "Мощность двигателя (кВт)" : "Мощность (л.с.)"}
                  </Label>
                  <Input
                    id="power"
                    type="number"
                    placeholder={isEv ? "150" : "250"}
                    value={power}
                    onChange={(e) => setPower(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Catalog mode: show auto-filled specs (read-only) */}
            {mode === "catalog" && selectedTrim && (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Привод</span>
                  <p className="font-medium">{selectedTrim.powertrainType?.toUpperCase() || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {isEv ? "Мощность (кВт)" : "Объём (см³)"}
                  </span>
                  <p className="font-medium">
                    {isEv
                      ? (selectedTrim.motorPowerKw ? `${selectedTrim.motorPowerKw} кВт` : "—")
                      : (selectedTrim.engineDisplacementCc ? `${selectedTrim.engineDisplacementCc} см³` : "—")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Батарея</span>
                  <p className="font-medium">
                    {selectedTrim.batteryCapacityKwh ? `${selectedTrim.batteryCapacityKwh} кВт·ч` : "—"}
                  </p>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || !isFormValid}>
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

            {/* Lead form */}
            {leadSubmitted ? (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <CheckCircle className="mb-4 h-12 w-12 text-emerald-600" />
                  <h3 className="mb-2 text-lg font-semibold">Заявка отправлена!</h3>
                  <p className="text-sm text-muted-foreground">
                    Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.
                  </p>
                </CardContent>
              </Card>
            ) : showLeadForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Получить точный расчёт
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Оставьте контакты, и мы подготовим точный расчёт с учётом актуальных курсов и тарифов
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeadSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lead-name">Имя *</Label>
                        <Input
                          id="lead-name"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Ваше имя"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lead-phone">Телефон *</Label>
                        <Input
                          id="lead-phone"
                          type="tel"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="+998 XX XXX XX XX"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lead-telegram">Telegram</Label>
                        <Input
                          id="lead-telegram"
                          value={leadTelegram}
                          onChange={(e) => setLeadTelegram(e.target.value)}
                          placeholder="@username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lead-contact">Предпочтительная связь</Label>
                        <Select
                          value={leadPreferredContact}
                          onValueChange={(v) => v && setLeadPreferredContact(v)}
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
                      <Label htmlFor="lead-comment">Комментарий</Label>
                      <textarea
                        id="lead-comment"
                        value={leadComment}
                        onChange={(e) => setLeadComment(e.target.value)}
                        placeholder="Ваши пожелания или вопросы..."
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={leadLoading}>
                      {leadLoading ? "Отправка..." : "Получить точный расчёт"}
                    </Button>

                    {leadError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {leadError}
                      </div>
                    )}

                    <p className="text-center text-xs text-muted-foreground">
                      Нажимая кнопку, вы соглашаетесь с{" "}
                      <a href="/privacy" className="underline hover:text-foreground">
                        политикой конфиденциальности
                      </a>
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="mb-3 text-muted-foreground">Нужен точный расчёт?</p>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => setShowLeadForm(true)}
                  >
                    Получить точный расчёт
                  </Button>
                </CardContent>
              </Card>
            )}
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
