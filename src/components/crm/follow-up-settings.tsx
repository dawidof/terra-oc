"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FollowUpStats {
  overdue: number;
  pending: number;
  completed: number;
}

const statCard = {
  overdue: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-brand-muted text-brand-muted-foreground",
} as const;

export function FollowUpSettings() {
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/follow-up");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
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

      <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          Новые заявки — напоминание через 24 часа
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          После связи — напоминание через 3 дня
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          Отправлен расчёт — напоминание через 3 дня
        </div>
      </div>

      <Button onClick={handleCheckNow} disabled={checking} variant="outline" size="sm" className="w-full">
        {checking ? (
          <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
        ) : (
          <Bell data-icon="inline-start" className="size-3.5" />
        )}
        {checking ? "Проверка..." : "Проверить сейчас"}
      </Button>
    </div>
  );
}
