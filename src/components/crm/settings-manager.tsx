"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";

interface SettingRow {
  key: string;
  valueJson: unknown;
  updatedAt: Date | string;
}

interface RateRow {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  recordedAt: Date | string;
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function SettingsManager({
  settings,
  rates,
}: {
  settings: SettingRow[];
  rates: RateRow[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(settings.map((s) => [s.key, stringifyValue(s.valueJson)]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [newSetting, setNewSetting] = useState({ key: "", value: "" });
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const latestByCurrency = new Map<string, RateRow>();
  for (const rate of rates) {
    if (!latestByCurrency.has(rate.toCurrency)) {
      latestByCurrency.set(rate.toCurrency, rate);
    }
  }

  async function saveSetting(key: string, raw: string) {
    setSavingKey(key);
    try {
      let value: unknown = raw;
      if (raw.trim() !== "") {
        try {
          value = JSON.parse(raw);
        } catch {
          value = raw;
        }
      }
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
      toast.success(`Настройка «${key}» сохранена`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newSetting.key.trim()) return;
    setAdding(true);
    try {
      await saveSetting(newSetting.key.trim(), newSetting.value);
      setNewSetting({ key: "", value: "" });
    } finally {
      setAdding(false);
    }
  }

  async function refreshRates() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/exchange-rates", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось обновить курсы");
      toast.success(`Курсы обновлены (${data.updated} валют)`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Настройки</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Параметры сайта и курсы валют
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-soft">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Параметры сайта
            </p>

            {settings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Настроек пока нет — добавьте первую ниже
              </p>
            )}

            {settings.map((setting) => (
              <div
                key={setting.key}
                className="flex flex-col gap-2 border-b border-border pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <Label className="font-mono text-xs">{setting.key}</Label>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(setting.updatedAt)}
                  </span>
                </div>
                <textarea
                  className="min-h-16 w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={values[setting.key] ?? ""}
                  onChange={(e) =>
                    setValues({ ...values, [setting.key]: e.target.value })
                  }
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={savingKey === setting.key}
                    onClick={() => saveSetting(setting.key, values[setting.key] ?? "")}
                  >
                    <Save data-icon="inline-start" className="size-3.5" />
                    {savingKey === setting.key ? "Сохранение…" : "Сохранить"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-3 rounded-xl bg-card p-5 shadow-soft"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Новая настройка
            </p>
            <div className="flex flex-col gap-2">
              <Label htmlFor="setting-key">Ключ</Label>
              <Input
                id="setting-key"
                required
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                placeholder="contact_phone"
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="setting-value">Значение (текст или JSON)</Label>
              <Input
                id="setting-value"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                placeholder="+998 90 123-45-67"
                className="font-mono"
              />
            </div>
            <Button type="submit" variant="outline" disabled={adding}>
              <Plus data-icon="inline-start" className="size-4" />
              Добавить
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Курсы валют
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={refreshRates}
            >
              <RefreshCw
                data-icon="inline-start"
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              Обновить
            </Button>
          </div>
          {latestByCurrency.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              Курсы не загружены — нажмите «Обновить»
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {[...latestByCurrency.values()].map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ArrowLeftRight className="size-3.5 text-muted-foreground" aria-hidden />
                    {rate.fromCurrency} → {rate.toCurrency}
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold tabular-nums">
                      {Number(rate.rate).toLocaleString("ru-RU")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDateTime(rate.recordedAt)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
