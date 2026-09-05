"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, FileText, AlertCircle, Play, CheckCircle, Loader2, Trash2, Plus } from "lucide-react";

interface ImportStats {
  brands: number;
  models: number;
  trims: number;
  offers: number;
  urlCount: number;
  rawCount: number;
}

interface ImportUrl {
  id: string;
  url: string;
  sourceSite: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

type StepStatus = "idle" | "running" | "done" | "error";

export default function ImportPage() {
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [stepOutputs, setStepOutputs] = useState<Record<string, string>>({});

  const [urls, setUrls] = useState<ImportUrl[]>([]);
  const [newUrls, setNewUrls] = useState("");
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [addingUrls, setAddingUrls] = useState(false);

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

  async function fetchUrls() {
    setUrlsLoading(true);
    try {
      const res = await fetch("/api/admin/import/urls");
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls || []);
      }
    } catch (err) {
      console.error("Failed to fetch URLs:", err);
    } finally {
      setUrlsLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
    fetchUrls();
  }, []);

  async function addUrls() {
    const urlList = newUrls
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && l.startsWith("http"));

    if (urlList.length === 0) return;

    setAddingUrls(true);
    try {
      const res = await fetch("/api/admin/import/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urlList }),
      });

      if (res.ok) {
        setNewUrls("");
        fetchUrls();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to add URLs:", err);
    } finally {
      setAddingUrls(false);
    }
  }

  async function deleteUrl(id: string) {
    try {
      const res = await fetch(`/api/admin/import/urls?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUrls();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete URL:", err);
    }
  }

  async function clearAllUrls() {
    if (!confirm("Удалить все URL?")) return;
    try {
      const res = await fetch("/api/admin/import/urls?clearAll=true", {
        method: "DELETE",
      });
      if (res.ok) {
        fetchUrls();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to clear URLs:", err);
    }
  }

  async function runAction(action: string) {
    setStepStatuses((prev) => ({ ...prev, [action]: "running" }));
    setStepOutputs((prev) => ({ ...prev, [action]: "" }));

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (res.ok) {
        setStepStatuses((prev) => ({ ...prev, [action]: "done" }));
        setStepOutputs((prev) => ({
          ...prev,
          [action]: data.output || JSON.stringify(data, null, 2),
        }));
        if (action === "persist" || action === "scrape") {
          fetchStats();
          fetchUrls();
        }
      } else {
        setStepStatuses((prev) => ({ ...prev, [action]: "error" }));
        setStepOutputs((prev) => ({ ...prev, [action]: data.error || "Unknown error" }));
      }
    } catch (err) {
      setStepStatuses((prev) => ({ ...prev, [action]: "error" }));
      setStepOutputs((prev) => ({
        ...prev,
        [action]: err instanceof Error ? err.message : "Network error",
      }));
    }
  }

  function getStepIcon(status: StepStatus) {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "done":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "pending":
        return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">Ожидает</span>;
      case "scraped":
        return <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">Спарсено</span>;
      case "imported":
        return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">Импортировано</span>;
      case "error":
        return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Ошибка</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-800">{status}</span>;
    }
  }

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

      {/* URL Management */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Шаг 1: URL-адреса для скрапинга
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <textarea
              value={newUrls}
              onChange={(e) => setNewUrls(e.target.value)}
              placeholder={"Введите URL-адреса, по одному на строку:\nhttps://gonzo-motors.uz/zeekr-7x\nhttps://gonzo-motors.uz/zeekr001"}
              className="flex-1 rounded-lg border p-3 font-mono text-sm"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addUrls}
              disabled={addingUrls || !newUrls.trim()}
              size="sm"
            >
              {addingUrls ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Добавить
            </Button>
            {urls.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearAllUrls}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить все
              </Button>
            )}
          </div>

          {/* URL List */}
          {urls.length > 0 && (
            <div className="rounded-lg border">
              <div className="grid grid-cols-12 gap-2 border-b bg-gray-50 p-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-6">URL</div>
                <div className="col-span-2">Источник</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-2">Действия</div>
              </div>
              {urls.map((url) => (
                <div key={url.id} className="grid grid-cols-12 gap-2 border-b p-2 text-sm last:border-0">
                  <div className="col-span-6 truncate font-mono text-xs">{url.url}</div>
                  <div className="col-span-2 text-xs text-muted-foreground">{url.sourceSite || "—"}</div>
                  <div className="col-span-2">{getStatusBadge(url.status)}</div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUrl(url.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {urls.length === 0 && !urlsLoading && (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-muted-foreground">
              Нет URL-адресов. Добавьте URL-адреса страниц автомобилей для скрапинга.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => runAction("scrape")}
              disabled={stepStatuses.scrape === "running" || urls.length === 0}
            >
              {getStepIcon(stepStatuses.scrape || "idle")}
              <span className="ml-2">
                {stepStatuses.scrape === "running"
                  ? "Выполняется..."
                  : stepStatuses.scrape === "done"
                    ? "Повторить скрапинг"
                    : "Запустить скрапинг"}
              </span>
            </Button>
            {stepOutputs.scrape && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
                {stepOutputs.scrape}
              </pre>
            )}
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => runAction("validate")}
              disabled={stepStatuses.validate === "running"}
            >
              {getStepIcon(stepStatuses.validate || "idle")}
              <span className="ml-2">
                {stepStatuses.validate === "running"
                  ? "Проверяется..."
                  : stepStatuses.validate === "done"
                    ? "Проверить снова"
                    : "Проверить данные"}
              </span>
            </Button>
            {stepOutputs.validate && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
                {stepOutputs.validate}
              </pre>
            )}
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => runAction("persist")}
              disabled={stepStatuses.persist === "running"}
            >
              {getStepIcon(stepStatuses.persist || "idle")}
              <span className="ml-2">
                {stepStatuses.persist === "running"
                  ? "Импортируется..."
                  : stepStatuses.persist === "done"
                    ? "Импортировать снова"
                    : "Импортировать в БД"}
              </span>
            </Button>
            {stepOutputs.persist && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-xs text-green-400">
                {stepOutputs.persist}
              </pre>
            )}
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
            <Button variant="ghost" size="sm" onClick={() => { fetchStats(); fetchUrls(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Обновить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
