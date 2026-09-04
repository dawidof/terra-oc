"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, FileText, AlertCircle } from "lucide-react";

interface ImportStats {
  brands: number;
  models: number;
  trims: number;
  offers: number;
}

export default function ImportPage() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Импорт данных</h1>
        <p className="text-muted-foreground">
          Управление импортом автомобилей из внешних источников
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Марки</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats?.brands ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Модели</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats?.models ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Комплектации</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats?.trims ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Предложения</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "—" : stats?.offers ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Import Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Шаг 1: Список URL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Добавьте URL-адреса страниц автомобилей в файл{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5">data/urls.txt</code>
            </p>
            <div className="rounded-lg bg-gray-50 p-3 font-mono text-xs">
              <p># Одна ссылка на строку</p>
              <p>https://gonzo-motors.uz/car/zeekr-7x</p>
              <p>https://gonzo-motors.uz/car/byd-seal</p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Открыть файл urls.txt
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Шаг 2: Скрапинг
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Извлекает данные со страниц и сохраняет в{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5">data/raw/</code>
            </p>
            <div className="rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
              <p>$ pnpm import:scrape</p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Запустить скрапинг
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Шаг 3: Валидация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Проверяет данные на ошибки и неполные поля перед импортом
            </p>
            <div className="rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
              <p># Автоматически при импорте</p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Проверить данные
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Шаг 4: Импорт в БД
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Импортирует нормализованные данные в базу данных
            </p>
            <div className="rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
              <p>$ pnpm import:persist</p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Импортировать в БД
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Current Data */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Текущие данные</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {stats ? `${stats.brands} марок, ${stats.models} моделей, ${stats.trims} комплектаций` : "Загрузка..."}
            </p>
            <Button variant="ghost" size="sm" onClick={fetchStats}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
