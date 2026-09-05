"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStatusOptions, getStatusLabel } from "./status-badge";
import { Save, UserPlus, Clock } from "lucide-react";

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
  const [saved, setSaved] = useState(false);

  const statusOptions = getStatusOptions();

  async function handleSave() {
    setLoading(true);
    setSaved(false);

    try {
      const updates: any = {};

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
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update lead:", err);
    } finally {
      setLoading(false);
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
            "Сохранение..."
          ) : saved ? (
            "Сохранено"
          ) : (
            <>
              <Save className="mr-1 h-4 w-4" />
              Сохранить
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
