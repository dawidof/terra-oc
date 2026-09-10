"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Database, FileText, Loader2, Play, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Heading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

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
      const res = await fetch(`/api/admin/import/urls?id=${id}`, { method: "DELETE" });
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
      const res = await fetch("/api/admin/import/urls?clearAll=true", { method: "DELETE" });
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
        return <Loader2 className="size-4 animate-spin text-blue-500" />;
      case "done":
        return <CheckCircle className="size-4 text-brand" />;
      case "error":
        return <AlertCircle className="size-4 text-red-500" />;
      default:
        return <Play className="size-4" />;
    }
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      pending: "bg-amber-50 text-amber-700",
      scraped: "bg-blue-50 text-blue-700",
      imported: "bg-brand-muted text-brand-muted-foreground",
      error: "bg-red-50 text-red-700",
    };
    const labels: Record<string, string> = {
      pending: "Ожидает",
      scraped: "Спарсено",
      imported: "Импортировано",
      error: "Ошибка",
    };
    return (
      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", map[status] ?? "bg-muted text-muted-foreground")}>
        {labels[status] ?? status}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Heading size="md">Импорт данных</Heading>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Управление импортом автомобилей из внешних источников
        </p>
      </div>

      {/* Stats */}
      <StatGrid>
        <StatCard label="Марки" value={loading ? "—" : (stats?.brands ?? 0)} icon={Database} tone="info" />
        <StatCard label="Модели" value={loading ? "—" : (stats?.models ?? 0)} icon={Database} tone="info" />
        <StatCard label="Комплектации" value={loading ? "—" : (stats?.trims ?? 0)} icon={Database} />
        <StatCard label="Предложения" value={loading ? "—" : (stats?.offers ?? 0)} icon={Database} />
      </StatGrid>

      {/* URL Management */}
      <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <FileText className="size-3.5" aria-hidden />
          Шаг 1: URL-адреса для скрапинга
        </p>

        <textarea
          value={newUrls}
          onChange={(e) => setNewUrls(e.target.value)}
          placeholder={"Введите URL-адреса, по одному на строку:\nhttps://gonzo-motors.uz/zeekr-7x\nhttps://gonzo-motors.uz/zeekr001"}
          className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          rows={4}
        />

        <div className="flex gap-2">
          <Button onClick={addUrls} disabled={addingUrls || !newUrls.trim()} size="sm">
            {addingUrls ? (
              <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
            ) : (
              <Plus data-icon="inline-start" className="size-4" />
            )}
            Добавить
          </Button>
          {urls.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAllUrls}>
              <Trash2 data-icon="inline-start" className="size-4" />
              Очистить все
            </Button>
          )}
        </div>

        {/* URL List */}
        {urls.length > 0 && (
          <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
              <div className="col-span-6">URL</div>
              <div className="col-span-2">Источник</div>
              <div className="col-span-2">Статус</div>
              <div className="col-span-2 text-right">Действия</div>
            </div>
            {urls.map((url) => (
              <div key={url.id} className="grid grid-cols-12 items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-0">
                <div className="col-span-6 truncate font-mono text-xs">{url.url}</div>
                <div className="col-span-2 text-xs text-muted-foreground">{url.sourceSite || "—"}</div>
                <div className="col-span-2">{getStatusBadge(url.status)}</div>
                <div className="col-span-2 text-right">
                  <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => deleteUrl(url.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {urls.length === 0 && !urlsLoading && (
          <div className="rounded-lg bg-muted/50 px-4 py-8 text-center text-sm text-muted-foreground">
            Нет URL-адресов. Добавьте URL-адреса страниц автомобилей для скрапинга.
          </div>
        )}
      </div>

      {/* Import Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            action: "scrape",
            title: "Шаг 2: Скрапинг",
            icon: RefreshCw,
            desc: "Извлекает данные со страниц и сохраняет в",
            code: "data/raw/",
            labels: { idle: "Запустить скрапинг", running: "Выполняется...", done: "Повторить скрапинг" },
          },
          {
            action: "validate",
            title: "Шаг 3: Валидация",
            icon: AlertCircle,
            desc: "Проверяет данные на ошибки и неполные поля перед импортом",
            code: null,
            labels: { idle: "Проверить данные", running: "Проверяется...", done: "Проверить снова" },
          },
          {
            action: "persist",
            title: "Шаг 4: Импорт в БД",
            icon: Database,
            desc: "Импортирует нормализованные данные в базу данных",
            code: null,
            labels: { idle: "Импортировать в БД", running: "Импортируется...", done: "Импортировать снова" },
          },
        ].map(({ action, title, icon: Icon, desc, code, labels }) => (
          <div key={action} className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <Icon className="size-3.5" aria-hidden />
              {title}
            </p>
            <p className="text-sm text-muted-foreground">
              {desc}
              {code && (
                <>
                  {" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">{code}</code>
                </>
              )}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => runAction(action)}
              disabled={stepStatuses[action] === "running" || (action === "scrape" && urls.length === 0)}
            >
              {getStepIcon(stepStatuses[action] || "idle")}
              <span className="ml-2">
                {stepStatuses[action] === "running"
                  ? labels.running
                  : stepStatuses[action] === "done"
                    ? labels.done
                    : labels.idle}
              </span>
            </Button>
            {stepOutputs[action] && (
              <pre className="max-h-40 overflow-auto rounded-lg bg-zinc-900 p-3 font-mono text-xs text-green-400">
                {stepOutputs[action]}
              </pre>
            )}
          </div>
        ))}
      </div>

      {/* Current Data */}
      <div className="flex items-center justify-between rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">
          {stats
            ? `${stats.brands} марок, ${stats.models} моделей, ${stats.trims} комплектаций`
            : "Загрузка..."}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchUrls();
          }}
        >
          <RefreshCw data-icon="inline-start" className="size-3.5" />
          Обновить
        </Button>
      </div>
    </div>
  );
}
