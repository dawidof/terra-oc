"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { KanbanColumn } from "./kanban-column";
import { STATUS_ORDER, getStatusStyle } from "./status-badge";

export interface KanbanLead {
  id: string;
  status: string;
  source: string | null;
  estimatedTotalUsd: string | null;
  createdAt: string;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  customerName: string;
  customerPhone: string | null;
  brandName: string | null;
  modelName: string | null;
  trimName: string | null;
  managerName: string | null;
  statusOrder: number;
}

interface KanbanBoardProps {
  leads: KanbanLead[];
}

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const router = useRouter();
  const [optimisticLeads, setOptimisticLeads] = useState<KanbanLead[]>(leads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  function handleDragStart(leadId: string, _sourceStatus: string) {
    setDraggedLeadId(leadId);
  }

  async function handleDrop(leadId: string, targetStatus: string) {
    setDraggedLeadId(null);

    setOptimisticLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: targetStatus } : lead
      )
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        setOptimisticLeads(leads);
        toast.error("Не удалось обновить статус заявки");
      } else {
        toast.success("Статус заявки обновлён");
        router.refresh();
      }
    } catch {
      setOptimisticLeads(leads);
      toast.error("Ошибка сети при обновлении статуса");
    }
  }

  function getLeadsForStatus(status: string): KanbanLead[] {
    return optimisticLeads
      .filter((lead) => lead.status === status)
      .sort((a, b) => a.statusOrder - b.statusOrder);
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-4">
      {STATUS_ORDER.map((status) => (
        <KanbanColumn
          key={status}
          status={status}
          label={getStatusStyle(status).plural}
          leads={getLeadsForStatus(status)}
          isDragActive={draggedLeadId !== null}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
