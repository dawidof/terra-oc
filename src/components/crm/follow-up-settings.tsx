"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Clock } from "lucide-react";

interface FollowUpStats {
  overdue: number;
  pending: number;
  completed: number;
}

export function FollowUpSettings() {
  const [stats, setStats] = useState<FollowUpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  async function fetchStats() {
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
  }

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleCheckNow() {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/follow-up", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to check follow-ups:", error);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-20 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Автоматические напоминания
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats?.overdue || 0}
            </div>
            <div className="text-xs text-red-600">Просрочено</div>
          </div>
          <div className="rounded-lg bg-amber-50 p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {stats?.pending || 0}
            </div>
            <div className="text-xs text-amber-600">Ожидает</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats?.completed || 0}
            </div>
            <div className="text-xs text-green-600">Выполнено</div>
          </div>
        </div>

        <div className="mb-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Новые заявки — напоминание через 24 часа</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>После связи — напоминание через 3 дня</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Отправлен расчёт — напоминание через 3 дня</span>
          </div>
        </div>

        <Button
          onClick={handleCheckNow}
          disabled={checking}
          className="w-full"
        >
          {checking ? (
            "Проверка..."
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Проверить сейчас
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
