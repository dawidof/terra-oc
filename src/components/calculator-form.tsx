"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { Calculator, Info, Search, X, Send, CheckCircle, Loader2, ReceiptText, RefreshCw, SlidersHorizontal, Car, ExternalLink } from "lucide-react";
import {
  CalculatorResultCard,
  type CalculationResult,
} from "@/components/calculator-result-card";

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
  imageUrl: string | null;
}

interface CalculatorFormProps {
  initialCountry?: string;
  initialCondition?: string;
  initialPrice?: number;
  initialCurrency?: string;
  initialPowertrain?: string;
  initialDisplacement?: number;
  initialPower?: number;
  initialYear?: number;
  initialTrim?: CatalogTrim | null;
  popularTrims?: CatalogTrim[];
}

const EV_POWERTRAINS = ["bev", "phev", "reev"];

const COUNTRIES = [
  { value: "Китай", label: "Китай" },
  { value: "Корея", label: "Корея" },
  { value: "США", label: "США" },
  { value: "ОАЭ", label: "ОАЭ (Дубай)" },
];

const CONDITIONS = [
  { value: "new", label: "Новый автомобиль" },
  { value: "used", label: "С пробегом" },
];

const CURRENCIES = [
  { value: "USD", label: "USD" },
  { value: "CNY", label: "CNY (Юань)" },
  { value: "KRW", label: "KRW (Вона)" },
  { value: "AED", label: "AED (Дирхам)" },
];

const POWERTRAINS = [
  { value: "bev", label: "Электро (BEV)" },
  { value: "phev", label: "Гибрид (PHEV)" },
  { value: "hev", label: "Гибрид (HEV)" },
  { value: "petrol", label: "Бензин" },
  { value: "diesel", label: "Дизель" },
];

const CONTACT_METHODS = [
  { value: "phone", label: "Телефон" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR + 1 - 1990 },
  (_, i) => String(CURRENT_YEAR + 1 - i)
);

const CALC_DEBOUNCE_MS = 700;

function parseDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 9);
}

function formatDigits(value: string): string {
  return value ? Number(value).toLocaleString("ru-RU") : "";
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "hev": return "Гибрид";
    case "reev": return "REEV";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    default: return "";
  }
}

interface RuleCombo {
  country: string;
  condition: string;
  powertrain: string;
}

interface CalcPayload {
  sourceCountry: string;
  condition: string;
  purchasePrice: number;
  currency: string;
  powertrain: string;
  engineDisplacementCc?: number;
  enginePowerHp?: number;
  motorPowerKw?: number;
  modelYear?: number;
  trimId?: string;
}

function queryParamsFromPayload(payload: CalcPayload): string {
  const params = new URLSearchParams();
  if (payload.trimId) {
    params.set("trim", payload.trimId);
  } else {
    if (payload.powertrain && payload.powertrain !== "bev") params.set("powertrain", payload.powertrain);
    if (payload.engineDisplacementCc) params.set("displacement", String(payload.engineDisplacementCc));
    if (payload.enginePowerHp) params.set("power", String(payload.enginePowerHp));
    if (payload.motorPowerKw) params.set("power", String(payload.motorPowerKw));
    if (payload.modelYear) params.set("year", String(payload.modelYear));
  }
  if (payload.purchasePrice > 0) params.set("price", String(Math.round(payload.purchasePrice)));
  if (payload.currency && payload.currency !== "USD") params.set("currency", payload.currency);
  if (payload.sourceCountry && payload.sourceCountry !== "Китай") params.set("country", payload.sourceCountry);
  if (payload.condition && payload.condition !== "new") params.set("condition", payload.condition);
  return params.toString();
}

export function CalculatorForm({
  initialCountry = "Китай",
  initialCondition = "new",
  initialPrice,
  initialCurrency,
  initialPowertrain = "bev",
  initialDisplacement,
  initialPower,
  initialYear,
  initialTrim = null,
  popularTrims = [],
}: CalculatorFormProps) {
  const hasManualParams = Boolean(initialPrice || initialDisplacement || initialPower);
  const [mode, setMode] = useState<"catalog" | "manual">(
    initialTrim || !hasManualParams ? "catalog" : "manual"
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ruleSuggestions, setRuleSuggestions] = useState<RuleCombo[] | null>(null);

  // Common fields
  const [sourceCountry, setSourceCountry] = useState(
    COUNTRIES.some((c) => c.value === initialCountry) ? initialCountry : "Китай"
  );
  const [condition, setCondition] = useState(
    initialCondition === "used" ? "used" : "new"
  );

  // Manual mode fields
  const [purchasePrice, setPurchasePrice] = useState(
    initialPrice
      ? parseDigits(String(initialPrice))
      : initialTrim?.basePrice
        ? initialTrim.basePrice.toString()
        : ""
  );
  const [currency, setCurrency] = useState(
    CURRENCIES.some((c) => c.value === initialCurrency)
      ? (initialCurrency as string)
      : initialTrim?.basePriceCurrency || "USD"
  );
  const [powertrain, setPowertrain] = useState(
    POWERTRAINS.some((p) => p.value === initialPowertrain)
      ? initialPowertrain
      : initialTrim?.powertrainType || "bev"
  );
  const [displacement, setDisplacement] = useState(
    initialDisplacement
      ? String(initialDisplacement)
      : initialTrim?.engineDisplacementCc
        ? String(initialTrim.engineDisplacementCc)
        : ""
  );
  const [power, setPower] = useState(
    initialPower
      ? String(initialPower)
      : initialTrim?.motorPowerKw
        ? initialTrim.motorPowerKw.toString()
        : ""
  );
  const [modelYear, setModelYear] = useState(initialYear ? String(initialYear) : "none");

  // Catalog mode fields
  const [catalogQuery, setCatalogQuery] = useState(
    initialTrim ? `${initialTrim.brandName} ${initialTrim.modelName} — ${initialTrim.trimName}` : ""
  );
  const [catalogResults, setCatalogResults] = useState<CatalogTrim[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedTrim, setSelectedTrim] = useState<CatalogTrim | null>(initialTrim);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculation request tracking
  const abortRef = useRef<AbortController | null>(null);
  const lastPayloadRef = useRef<string | null>(null);
  const resultColumnRef = useRef<HTMLDivElement>(null);

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

  // Exchange rate state
  const [exchangeRate, setExchangeRate] = useState<{ rate: number; source: string; recordedAt: string } | null>(null);

  const isEv = EV_POWERTRAINS.includes(powertrain);
  const refreshing = loading && result !== null;

  // Fetch live exchange rate once
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/exchange-rate");
        if (res.ok) {
          const data = await res.json();
          setExchangeRate({
            rate: data.rate,
            source: data.source,
            recordedAt: data.recordedAt,
          });
        }
      } catch {
        // Silently fail - exchange rate is optional
      }
    })();
  }, []);

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

  const scrollToResult = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultColumnRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  const runCalculation = useCallback(
    async (payload: CalcPayload, key: string, scrollAfter: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      setRuleSuggestions(null);

      try {
        const res = await fetch("/api/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted) return;

        if (data.breakdown) {
          setResult(data.breakdown);
          setRuleSuggestions(null);
          lastPayloadRef.current = key;
          if (typeof window !== "undefined") {
            const qs = queryParamsFromPayload(payload);
            window.history.replaceState(null, "", qs ? `/calculator?${qs}` : "/calculator");
          }
          if (scrollAfter) scrollToResult();
        } else if (data.error) {
          setError(data.error);
          setRuleSuggestions(Array.isArray(data.available) ? data.available : null);
        } else {
          setError("Для выбранных параметров нет правил расчёта. Попробуйте изменить страну или тип привода.");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Ошибка при расчёте. Проверьте параметры и попробуйте ещё раз.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [scrollToResult]
  );

  const calcPayload = useMemo<CalcPayload | null>(() => {
    const price = Number(purchasePrice);
    if (!price || price <= 0) return null;
    if (mode === "catalog" && !selectedTrim) return null;
    const isElectric = EV_POWERTRAINS.includes(powertrain);
    return {
      sourceCountry,
      condition,
      purchasePrice: price,
      currency,
      powertrain,
      engineDisplacementCc: !isElectric && displacement ? Number(displacement) : undefined,
      ...(isElectric
        ? { motorPowerKw: power ? Number(power) : undefined }
        : { enginePowerHp: power ? Number(power) : undefined }),
      modelYear: modelYear !== "none" ? Number(modelYear) : undefined,
      trimId: selectedTrim?.trimId,
    };
  }, [mode, purchasePrice, selectedTrim, sourceCountry, condition, currency, powertrain, displacement, power, modelYear]);

  // Auto-calculate with debounce
  useEffect(() => {
    if (!calcPayload) return;
    const key = JSON.stringify(calcPayload);
    if (key === lastPayloadRef.current) return;
    const timeoutId = setTimeout(() => {
      void runCalculation(calcPayload, key, false);
    }, CALC_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [calcPayload, runCalculation]);

  // Abort in-flight calculation on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Scroll highlighted catalog option into view
  useEffect(() => {
    if (highlightIndex < 0 || !showDropdown) return;
    document
      .getElementById(`calculator-trim-option-${highlightIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, showDropdown]);

  const searchCatalog = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCatalogResults([]);
      return;
    }
    setCatalogLoading(true);
    try {
      const res = await fetch(`/api/search-trims?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const trims: CatalogTrim[] = (data.trims || []).map((t: CatalogTrim) => ({
        ...t,
        basePrice: t.basePrice != null ? Number(t.basePrice) : null,
        batteryCapacityKwh: t.batteryCapacityKwh != null ? Number(t.batteryCapacityKwh) : null,
      }));
      setCatalogResults(trims);
      setHighlightIndex(trims.length > 0 ? 0 : -1);
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

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || catalogResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % catalogResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? catalogResults.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const index = highlightIndex >= 0 ? highlightIndex : 0;
      const trim = catalogResults[index];
      if (trim) selectCatalogTrim(trim);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  function selectCatalogTrim(trim: CatalogTrim) {
    setSelectedTrim(trim);
    setCatalogQuery(`${trim.brandName} ${trim.modelName} — ${trim.trimName}`);
    setCatalogResults([]);
    setShowDropdown(false);
    setHighlightIndex(-1);
    searchInputRef.current?.blur();

    // Auto-fill fields from catalog data
    setPurchasePrice(trim.basePrice ? trim.basePrice.toString() : "");
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
    setShowDropdown(false);
    setHighlightIndex(-1);
    setPurchasePrice("");
    setCurrency("USD");
    setPowertrain(initialPowertrain);
    setDisplacement("");
    setPower("");
    setModelYear("none");
    searchInputRef.current?.focus();
  }

  function switchMode(next: "manual" | "catalog") {
    if (next === mode) return;
    setMode(next);
    if (next === "manual") {
      setSelectedTrim(null);
      setCatalogQuery("");
      setCatalogResults([]);
      setShowDropdown(false);
    }
  }

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    if (!calcPayload) return;
    void runCalculation(calcPayload, JSON.stringify(calcPayload), true);
  }

  const uzsRate = exchangeRate?.rate || result?.exchangeRate || 0;

  const [shareCopied, setShareCopied] = useState(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopyShare() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
      shareTimerRef.current = setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Clipboard unavailable - ignore
    }
  }

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  const isFormValid = Boolean(calcPayload);

  const ruleSuggestionGroups = useMemo(() => {
    if (!ruleSuggestions || ruleSuggestions.length === 0) return null;
    const conditionText = (c: string) => (c === "used" ? "С пробегом" : "Новый");

    const sameEngine = ruleSuggestions.filter(
      (r) => r.powertrain === powertrain && r.condition === condition
    );
    if (sameEngine.length > 0) {
      return {
        hint: "Этот тип двигателя рассчитывается из:",
        options: [...new Set(sameEngine.map((r) => r.country))].map((country) => ({
          label: country,
          apply: () => setSourceCountry(country),
        })),
      };
    }

    const sameCountry = ruleSuggestions.filter(
      (r) => r.country === sourceCountry && r.condition === condition
    );
    if (sameCountry.length > 0) {
      return {
        hint: "Для этой страны рассчитываются:",
        options: sameCountry.map((r) => ({
          label: powertrainLabel(r.powertrain) || r.powertrain,
          apply: () => setPowertrain(r.powertrain),
        })),
      };
    }

    const sameCountryAnyCondition = ruleSuggestions.filter((r) => r.country === sourceCountry);
    if (sameCountryAnyCondition.length > 0) {
      return {
        hint: "Ближайшие доступные варианты:",
        options: sameCountryAnyCondition.slice(0, 3).map((r) => ({
          label: `${conditionText(r.condition)} · ${powertrainLabel(r.powertrain) || r.powertrain}`,
          apply: () => {
            setCondition(r.condition);
            setPowertrain(r.powertrain);
          },
        })),
      };
    }

    return {
      hint: "Доступные варианты:",
      options: ruleSuggestions.slice(0, 3).map((r) => ({
        label: `${r.country} · ${conditionText(r.condition)} · ${powertrainLabel(r.powertrain) || r.powertrain}`,
        apply: () => {
          setSourceCountry(r.country);
          setCondition(r.condition);
          setPowertrain(r.powertrain);
        },
      })),
    };
  }, [ruleSuggestions, powertrain, condition, sourceCountry]);

  const displacementNum = Number(displacement);
  const powerNum = Number(power);
  const displacementInvalid =
    !isEv && displacement !== "" && (!Number.isFinite(displacementNum) || displacementNum < 500 || displacementNum > 8000);
  const powerInvalid =
    power !== "" &&
    (isEv ? powerNum < 10 || powerNum > 1500 : powerNum < 20 || powerNum > 2000);

  const yearField = (
    <div className="space-y-2">
      <Label htmlFor="year">Год выпуска</Label>
      <Select
        value={modelYear}
        onValueChange={(v) => v && setModelYear(v)}
        items={[{ value: "none", label: "Не указан" }, ...YEARS.map((y) => ({ value: y, label: y }))]}
      >
        <SelectTrigger id="year" className="w-full">
          <SelectValue placeholder="Не указан" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none" label="Не указан">Не указан</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={y} label={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

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
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "catalog" ? "default" : "outline"}
                aria-pressed={mode === "catalog"}
                onClick={() => switchMode("catalog")}
              >
                Из каталога
              </Button>
              <Button
                type="button"
                variant={mode === "manual" ? "default" : "outline"}
                aria-pressed={mode === "manual"}
                onClick={() => switchMode("manual")}
              >
                Вручную
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">Страна отправления</Label>
                <Select
                  value={sourceCountry}
                  onValueChange={(v) => v && setSourceCountry(v)}
                  items={COUNTRIES}
                >
                  <SelectTrigger id="country" className="w-full">
                    <SelectValue placeholder="Страна" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} label={c.label}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Состояние</Label>
                <Select
                  value={condition}
                  onValueChange={(v) => v && setCondition(v)}
                  items={CONDITIONS}
                >
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue placeholder="Состояние" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value} label={c.label}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Catalog mode: search input */}
            {mode === "catalog" && (
              <div className="space-y-2" ref={dropdownRef}>
                <Label htmlFor="trim-search">Автомобиль из каталога</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="trim-search"
                    ref={searchInputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls="calculator-trim-listbox"
                    aria-activedescendant={
                      showDropdown && highlightIndex >= 0
                        ? `calculator-trim-option-${highlightIndex}`
                        : undefined
                    }
                    aria-autocomplete="list"
                    placeholder="Начните вводить марку или модель..."
                    value={catalogQuery}
                    onChange={(e) => handleCatalogSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => catalogResults.length > 0 && setShowDropdown(true)}
                    className="pl-9 pr-9"
                  />
                  {catalogQuery && (
                    <button
                      type="button"
                      onClick={clearCatalogSelection}
                      aria-label="Очистить выбор"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {showDropdown && catalogResults.length > 0 && (
                    <div
                      id="calculator-trim-listbox"
                      role="listbox"
                      aria-label="Результаты поиска"
                      className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-auto"
                    >
                      {catalogResults.map((trim, index) => (
                        <button
                          key={trim.trimId}
                          id={`calculator-trim-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={index === highlightIndex}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                            index === highlightIndex
                              ? "bg-accent text-accent-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                          onMouseEnter={() => setHighlightIndex(index)}
                          onClick={() => selectCatalogTrim(trim)}
                        >
                          <span className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                            {trim.imageUrl ? (
                              <img
                                src={trim.imageUrl}
                                alt={`${trim.brandName} ${trim.modelName}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Car className="size-4 text-muted-foreground/50" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {trim.brandName} {trim.modelName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {trim.trimName}
                              {trim.powertrainType && ` · ${powertrainLabel(trim.powertrainType)}`}
                            </span>
                          </span>
                          {trim.basePrice != null && (
                            <span className="shrink-0 text-sm font-semibold text-emerald-600">
                              ${trim.basePrice.toLocaleString("ru-RU")}
                            </span>
                          )}
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
                {!selectedTrim && !catalogQuery && popularTrims.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-muted-foreground">Популярные модели</p>
                    <div className="flex flex-wrap gap-2">
                      {popularTrims.map((trim) => (
                        <button
                          key={trim.trimId}
                          type="button"
                          onClick={() => selectCatalogTrim(trim)}
                          className="flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <span className="flex h-8 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {trim.imageUrl ? (
                              <img
                                src={trim.imageUrl}
                                alt={`${trim.brandName} ${trim.modelName}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Car className="size-4 text-muted-foreground/50" />
                            )}
                          </span>
                          <span>
                            {trim.brandName} {trim.modelName}
                          </span>
                          {trim.basePrice != null && (
                            <span className="text-muted-foreground text-xs">
                              ${trim.basePrice.toLocaleString("ru-RU")}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {selectedTrim && (
                  <div className="flex items-start gap-3 rounded-md bg-muted p-3 text-sm">
                    {selectedTrim.imageUrl && (
                      <img
                        src={selectedTrim.imageUrl}
                        alt={`${selectedTrim.brandName} ${selectedTrim.modelName}`}
                        className="h-12 w-16 shrink-0 rounded-md object-cover"
                      />
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">
                        {selectedTrim.brandName} {selectedTrim.modelName}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedTrim.trimName}
                        {selectedTrim.powertrainType && ` · ${selectedTrim.powertrainType.toUpperCase()}`}
                        {selectedTrim.motorPowerKw && ` · ${selectedTrim.motorPowerKw} кВт`}
                        {selectedTrim.engineDisplacementCc && ` · ${selectedTrim.engineDisplacementCc} см³`}
                      </p>
                      <Link
                        href={`/cars/${selectedTrim.trimSlug}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-deep"
                      >
                        <ExternalLink className="size-3" />
                        Открыть страницу автомобиля
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual mode: price + currency */}
            {mode === "manual" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Цена покупки</Label>
                  <Input
                    id="price"
                    type="text"
                    inputMode="numeric"
                    placeholder="35 000"
                    value={formatDigits(purchasePrice)}
                    onChange={(e) => setPurchasePrice(parseDigits(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Валюта</Label>
                  <Select
                    value={currency}
                    onValueChange={(v) => v && setCurrency(v)}
                    items={CURRENCIES}
                  >
                    <SelectTrigger id="currency" className="w-full">
                      <SelectValue placeholder="Валюта" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} label={c.label}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Catalog mode: price (auto-filled, adjustable) + currency */}
            {mode === "catalog" && selectedTrim && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="catalog-price">
                    Цена покупки{selectedTrim.basePrice ? " (из каталога)" : ""}
                  </Label>
                  <Input
                    id="catalog-price"
                    type="text"
                    inputMode="numeric"
                    placeholder="35 000"
                    value={formatDigits(purchasePrice)}
                    onChange={(e) => setPurchasePrice(parseDigits(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="catalog-currency">Валюта</Label>
                  <Input id="catalog-currency" type="text" value={currency} readOnly className="bg-muted" />
                </div>
              </div>
            )}

            {/* Manual mode: powertrain + displacement + power + year */}
            {mode === "manual" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="powertrain">Тип привода</Label>
                    <Select
                      value={powertrain}
                      onValueChange={(v) => v && setPowertrain(v)}
                      items={POWERTRAINS}
                    >
                      <SelectTrigger id="powertrain" className="w-full">
                        <SelectValue placeholder="Тип привода" />
                      </SelectTrigger>
                      <SelectContent>
                        {POWERTRAINS.map((p) => (
                          <SelectItem key={p.value} value={p.value} label={p.label}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!isEv && (
                    <div className="space-y-2">
                      <Label htmlFor="displacement">Объём двигателя (см³)</Label>
                      <Input
                        id="displacement"
                        type="number"
                        inputMode="numeric"
                        placeholder="2000"
                        min={500}
                        max={8000}
                        value={displacement}
                        onChange={(e) => setDisplacement(e.target.value)}
                        aria-invalid={displacementInvalid || undefined}
                      />
                    </div>
                  )}

                  {isEv && (
                    <div className="space-y-2">
                      <Label htmlFor="power">Мощность двигателя (кВт)</Label>
                      <Input
                        id="power"
                        type="number"
                        inputMode="numeric"
                        placeholder="150"
                        min={10}
                        max={1500}
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        aria-invalid={powerInvalid || undefined}
                      />
                    </div>
                  )}
                </div>

                {!isEv && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="power-ice">Мощность (л.с.)</Label>
                      <Input
                        id="power-ice"
                        type="number"
                        inputMode="numeric"
                        placeholder="250"
                        min={20}
                        max={2000}
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        aria-invalid={powerInvalid || undefined}
                      />
                    </div>
                    {yearField}
                  </div>
                )}

                {isEv && <div className="grid grid-cols-2 gap-4">{yearField}</div>}

                {displacementInvalid && (
                  <p className="text-xs text-amber-600">
                    Укажите объём двигателя от 500 до 8000 см³
                  </p>
                )}
                {powerInvalid && (
                  <p className="text-xs text-amber-600">
                    Укажите мощность в допустимом диапазоне ({isEv ? "10–1500 кВт" : "20–2000 л.с."})
                  </p>
                )}
              </>
            )}

            {/* Catalog mode: show auto-filled specs (read-only) */}
            {mode === "catalog" && selectedTrim && (
              <div className={`grid ${isEv ? "grid-cols-3" : "grid-cols-2"} gap-4 text-sm`}>
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
                {isEv && (
                  <div>
                    <span className="text-muted-foreground">Батарея</span>
                    <p className="font-medium">
                      {selectedTrim.batteryCapacityKwh ? `${selectedTrim.batteryCapacityKwh} кВт·ч` : "—"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-brand text-brand-foreground shadow-sm hover:bg-brand-deep"
              size="lg"
              disabled={loading || !isFormValid}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Расчёт..." : "Рассчитать стоимость"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Расчёт обновляется автоматически при изменении параметров
            </p>
          </form>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
              {error}
              {ruleSuggestionGroups && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-red-500">{ruleSuggestionGroups.hint}</span>
                  {ruleSuggestionGroups.options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={option.apply}
                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs text-red-700 hover:bg-red-100 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div ref={resultColumnRef} className="space-y-6 scroll-mt-24">
        {result ? (
          <>
            <CalculatorResultCard
              result={result}
              refreshing={refreshing}
              uzsRate={uzsRate}
              rateSource={exchangeRate?.source || null}
              shareCopied={shareCopied}
              onCopyShare={handleCopyShare}
            />

            <Card className="border-brand/20 bg-brand-muted">
              <CardContent className="flex gap-3 p-4">
                <Info className="h-5 w-5 shrink-0 text-brand" />
                <p className="text-sm text-brand-muted-foreground">
                  Расчёт носит ориентировочный характер. Итоговая стоимость зависит от фактической
                  цены автомобиля, курса валют, стоимости логистики и действующих на дату оформления
                  таможенных платежей.
                </p>
              </CardContent>
            </Card>

            {/* Lead form */}
            {leadSubmitted ? (
              <Card className="border-brand/25 bg-brand-muted">
                <CardContent className="flex flex-col items-center py-8 text-center">
                  <CheckCircle className="mb-4 h-12 w-12 text-brand" />
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
                          items={CONTACT_METHODS}
                        >
                          <SelectTrigger id="lead-contact" className="w-full">
                            <SelectValue placeholder="Телефон" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTACT_METHODS.map((m) => (
                              <SelectItem key={m.value} value={m.value} label={m.label}>
                                {m.label}
                              </SelectItem>
                            ))}
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
                      {leadLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {leadLoading ? "Отправка..." : "Получить точный расчёт"}
                    </Button>

                    {leadError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600" role="alert">
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
          <Card className="flex flex-col items-center justify-center py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-xl bg-brand-muted">
              <Calculator className="h-7 w-7 text-brand" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">Введите параметры</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Укажите страну отправления, цену и тип автомобиля, чтобы увидеть ориентировочную
              стоимость под ключ в Узбекистане.
            </p>
            <div className="mt-8 grid w-full max-w-md gap-4 text-left sm:grid-cols-3">
              {[
                {
                  icon: SlidersHorizontal,
                  title: "1. Параметры",
                  desc: "Страна, цена и тип автомобиля",
                },
                {
                  icon: RefreshCw,
                  title: "2. Расчёт",
                  desc: "Обновляется автоматически",
                },
                {
                  icon: ReceiptText,
                  title: "3. Заявка",
                  desc: "Точный расчёт от менеджера",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-lg bg-muted/60 p-3">
                  <Icon className="h-4 w-4 text-brand" />
                  <p className="mt-2 text-xs font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
