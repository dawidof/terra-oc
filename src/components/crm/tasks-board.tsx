"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUpRight, CalendarClock, Check, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/crm/status-badge";
import { formatDate, formatUsd } from "@/lib/format";

interface Task {
  id: string;
  status: string;
  estimatedTotalUsd: string | null;
  nextFollowUpAt: Date | string | null;
  customerName: string;
  customerPhone: string | null;
  assignedManagerName: string | null;
  brandName: string | null;
  modelName: string | null;
}

function isTaskOverdue(task: Task): boolean {
  return (
    task.nextFollowUpAt !== null &&
    new Date(task.nextFollowUpAt).getTime() < Date.now()
  );
}

function TaskCard({
  task,
  onAction,
}: {
  task: Task;
  onAction: (task: Task, body: Record<string, unknown>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const isOverdue = isTaskOverdue(task);

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await onAction(task, body);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl bg-card p-4 shadow-soft ring-1 ${
        isOverdue ? "ring-red-200" : "ring-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/crm/leads/${task.id}`}
            className="truncate text-sm font-medium hover:text-brand"
          >
            {task.customerName}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            {[task.brandName, task.modelName].filter(Boolean).join(" ") || "—"}
          </p>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span
          className={`flex items-center gap-1 font-medium ${
            isOverdue ? "text-red-600" : "text-amber-600"
          }`}
        >
          <CalendarClock className="size-3.5" aria-hidden />
          {formatDate(task.nextFollowUpAt)}
        </span>
        {task.customerPhone && (
          <span className="flex items-center gap-1">
            <Phone className="size-3.5" aria-hidden />
            {task.customerPhone}
          </span>
        )}
        {task.assignedManagerName && <span>{task.assignedManagerName}</span>}
        {task.estimatedTotalUsd && (
          <span className="font-medium text-foreground">
            {formatUsd(task.estimatedTotalUsd)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => run({ action: "complete" })}
          disabled={busy}
        >
          <Check data-icon="inline-start" className="size-3.5" />
          Готово
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => run({ action: "reschedule", days: 1 })}
          disabled={busy}
        >
          +1 день
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => run({ action: "reschedule", days: 3 })}
          disabled={busy}
        >
          +3 дня
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => run({ action: "reschedule", days: 7 })}
          disabled={busy}
        >
          +7 дней
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Открыть заявку ${task.customerName}`}
          render={<Link href={`/crm/leads/${task.id}`} />}
          nativeButton={false}
          disabled={busy}
        >
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function TasksBoard({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const overdue = tasks.filter(isTaskOverdue);
  const today = tasks.filter((t) => !isTaskOverdue(t));

  async function handleAction(task: Task, body: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/leads/${task.id}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось обновить задачу");
      toast.success(
        body.action === "complete" ? "Задача выполнена" : "Задача перенесена"
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Задачи</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Звонки на сегодня и просроченные · всего {tasks.length}
        </p>
      </div>

      {tasks.length === 0 && (
        <div className="rounded-xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">
            Задач на сегодня нет — отличный момент для отдыха
          </p>
        </div>
      )}

      {overdue.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-red-600">
            Просрочено
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold">
              {overdue.length}
            </span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {overdue.map((task) => (
              <TaskCard key={task.id} task={task} onAction={handleAction} />
            ))}
          </div>
        </section>
      )}

      {today.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-medium text-amber-600">
            Сегодня
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold">
              {today.length}
            </span>
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {today.map((task) => (
              <TaskCard key={task.id} task={task} onAction={handleAction} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
