"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Loader2, Save, Trash2, UserPlus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toDateInputValue } from "@/lib/format";

import { getStatusOptions } from "./status-badge";
import { SOURCE_OPTIONS } from "./lead-source";

interface Manager {
  id: string;
  name: string;
}

interface LeadDetailActionsProps {
  leadId: string;
  currentStatus: string;
  currentSource: string | null;
  currentManagerId: string | null;
  managers: Manager[];
  userRole: string;
  nextFollowUpAt: Date | null;
}

export function LeadDetailActions({
  leadId,
  currentStatus,
  currentSource,
  currentManagerId,
  managers,
  userRole,
  nextFollowUpAt,
}: LeadDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [source, setSource] = useState(currentSource || "");
  const [managerId, setManagerId] = useState(currentManagerId || "");
  const [followUpDate, setFollowUpDate] = useState(toDateInputValue(nextFollowUpAt));
  const [loading, setLoading] = useState(false);

  const statusOptions = getStatusOptions();

  async function handleSave() {
    setLoading(true);

    try {
      const updates: Record<string, unknown> = {};
      const originalFollowUp = toDateInputValue(nextFollowUpAt);

      if (status !== currentStatus) {
        updates.status = status;
      }
      if (source !== (currentSource || "")) {
        updates.source = source || null;
      }
      if (userRole === "admin" && managerId !== currentManagerId) {
        updates.assignedManagerId = managerId || null;
      }
      if (followUpDate !== originalFollowUp) {
        updates.nextFollowUpAt = followUpDate
          ? new Date(followUpDate).toISOString()
          : null;
      }

      if (Object.keys(updates).length === 0) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        toast.success("Заявка обновлена");
        router.refresh();
      } else {
        toast.error("Не удалось обновить заявку");
      }
    } catch {
      toast.error("Ошибка сети при сохранении");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Заявка удалена");
        router.push("/crm/leads");
      } else {
        toast.error("Не удалось удалить заявку");
      }
    } catch {
      toast.error("Ошибка сети при удалении");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Управление
      </p>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">Статус</Label>
        <Select
          value={status}
          onValueChange={(v) => v && setStatus(v)}
          items={statusOptions}
        >
          <SelectTrigger>
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(userRole === "admin") && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Источник</Label>
          <Select
            value={source}
            onValueChange={(v) => setSource(v || "")}
            items={[{ value: "", label: "Не указан" }, ...SOURCE_OPTIONS]}
          >
            <SelectTrigger>
              <SelectValue placeholder="Источник" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" label="Не указан">
                Не указан
              </SelectItem>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {userRole === "admin" && (
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserPlus className="size-3.5" aria-hidden />
            Менеджер
          </Label>
          <Select
            value={managerId}
            onValueChange={(v) => setManagerId(v || "")}
            items={[
              { value: "none", label: "Не назначен" },
              ...managers.map((m) => ({ value: m.id, label: m.name })),
            ]}
          >
            <SelectTrigger>
              <SelectValue placeholder="Не назначен" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" label="Не назначен">
                Не назначен
              </SelectItem>
              {managers.map((m) => (
                <SelectItem key={m.id} value={m.id} label={m.name}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          Следующий звонок
        </Label>
        <DatePicker
          value={followUpDate}
          onChange={setFollowUpDate}
        />
      </div>

      <Button onClick={handleSave} disabled={loading} className="w-full">
        {loading ? (
          <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
        ) : (
          <Save data-icon="inline-start" className="size-4" />
        )}
        {loading ? "Сохранение..." : "Сохранить"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button variant="destructive" className="w-full" />
          }
        >
          <Trash2 data-icon="inline-start" className="size-4" />
          Удалить заявку
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Заявка и все связанные данные будут
              удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
