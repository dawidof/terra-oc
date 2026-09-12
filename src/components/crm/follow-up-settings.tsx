"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FollowUpStats {
  overdue: number;
  pending: number;
  completed: number;
}

interface FollowUpRule {
  status: string;
  delayHours: number;
  enabled: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  quote_sent: "Предложение",
  needs_follow_up: "Требует звонка",
};

const statCard = {
  overdue: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-brand-muted text-brand-muted-foreground",
} as const;

export function FollowUpSettings() {
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [rules, setRules] = useState<FollowUpRule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/follow-up");
        if (res.ok) {
          const data = await res.json();
          setStats({
            overdue: data.overdue,
            pending: data.pending,
            completed: data.completed,
          });
          setRules(data.rules || []);
        }
      } catch (error) {
        console.error("Failed to fetch follow-up stats:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCheckNow() {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/follow-up", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        toast.success("Напоминания обновлены");
      } else {
        toast.error("Не удалось проверить напоминания");
      }
    } catch {
      toast.error("Ошибка сети при проверке напоминаний");
    } finally {
      setChecking(false);
    }
  }

  function updateRule(status: string, patch: Partial<FollowUpRule>) {
    setRules((prev) =>
      prev
        ? prev.map((r) => (r.status === status ? { ...r, ...patch } : r))
        : prev
    );
    setDirty(true);
  }

  async function handleSave() {
    if (!rules) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/follow-up", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules);
        setDirty(false);
        toast.success("Правила напоминаний сохранены");
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Не удалось сохранить правила");
      }
    } catch {
      toast.error("Ошибка сети при сохранении правил");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Bell className="size-3.5" aria-hidden />
        Автоматические напоминания
      </p>

      <div className="grid grid-cols-3 gap-3">
        {(["overdue", "pending", "completed"] as const).map((key) => (
          <div
            key={key}
            className={cn(
              "flex flex-col items-center rounded-lg px-3 py-2.5",
              statCard[key]
            )}
          >
            <span className="text-2xl font-semibold tabular-nums">
              {stats?.[key] ?? 0}
            </span>
            <span className="mt-0.5 text-[11px] font-medium">
              {key === "overdue" ? "Просрочено" : key === "pending" ? "Ожидает" : "Выполнено"}
            </span>
          </div>
        ))}
      </div>

      {rules && rules.length > 0 && (
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <div
              key={rule.status}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
                !rule.enabled && "opacity-50"
              )}
            >
              <label
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm"
                htmlFor={`follow-up-${rule.status}`}
              >
                <input
                  id={`follow-up-enabled-${rule.status}`}
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={rule.enabled}
                  onChange={(e) =>
                    updateRule(rule.status, { enabled: e.target.checked })
                  }
                />
                <span className="truncate">
                  {STATUS_LABELS[rule.status] || rule.status}
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  id={`follow-up-${rule.status}`}
                  type="number"
                  min={1}
                  max={720}
                  value={rule.delayHours}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    updateRule(rule.status, {
                      delayHours: Number.isFinite(value) ? value : rule.delayHours,
                    });
                  }}
                  className="h-8 w-20 text-right"
                  disabled={!rule.enabled}
                />
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  ч
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleCheckNow}
          disabled={checking}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          {checking ? (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
          ) : (
            <Bell data-icon="inline-start" className="size-3.5" />
          )}
          {checking ? "Проверка..." : "Проверить сейчас"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={!dirty || saving}
          size="sm"
          className="flex-1"
        >
          {saving ? (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
          ) : (
            <Save data-icon="inline-start" className="size-3.5" />
          )}
          Сохранить
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="size-3.5 shrink-0" aria-hidden />
        Правила применяются при запуске планировщика по расписанию
      </div>
    </div>
  );
}
