"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStatusOptions } from "./status-badge";
import { Save, UserPlus, Clock, Trash2, Loader2 } from "lucide-react";

interface Manager {
  id: string;
  name: string;
}

interface LeadDetailActionsProps {
  leadId: string;
  currentStatus: string;
  currentManagerId: string | null;
  managers: Manager[];
  userRole: string;
  nextFollowUpAt: Date | null;
}

export function LeadDetailActions({
  leadId,
  currentStatus,
  currentManagerId,
  managers,
  userRole,
  nextFollowUpAt,
}: LeadDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [managerId, setManagerId] = useState(currentManagerId || "");
  const [followUpDate, setFollowUpDate] = useState(
    nextFollowUpAt
      ? new Date(nextFollowUpAt).toISOString().slice(0, 16)
      : ""
  );
  const [loading, setLoading] = useState(false);

  const statusOptions = getStatusOptions();

  async function handleSave() {
    setLoading(true);

    try {
      const updates: Record<string, unknown> = {};

      if (status !== currentStatus) {
        updates.status = status;
      }

      if (userRole === "admin" && managerId !== currentManagerId) {
        updates.assignedManagerId = managerId || null;
      }

      if (followUpDate !== (nextFollowUpAt ? new Date(nextFollowUpAt).toISOString().slice(0, 16) : "")) {
        updates.nextFollowUpAt = followUpDate ? new Date(followUpDate).toISOString() : null;
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
        router.push("/crm");
      } else {
        toast.error("Не удалось удалить заявку");
      }
    } catch {
      toast.error("Ошибка сети при удалении");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Управление</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <Label>Статус</Label>
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

        {/* Manager (admin only) */}
        {userRole === "admin" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Менеджер
            </Label>
            <Select
              value={managerId}
              onValueChange={(v) => setManagerId(v || "")}
              items={[{ value: "none", label: "Не назначен" }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
            >
              <SelectTrigger>
                <SelectValue placeholder="Не назначен" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" label="Не назначен">Не назначен</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id} label={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Follow-up */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Следующий звонок
          </Label>
          <Input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          {loading ? "Сохранение..." : "Сохранить"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" className="w-full" />}>
            <Trash2 className="mr-1 h-4 w-4" />
            Удалить заявку
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Заявка и все связанные данные будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
