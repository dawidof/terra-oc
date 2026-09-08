"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KanbanColumn } from "./kanban-column";

interface KanbanLead {
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

const COLUMNS = [
  { status: "new", label: "Новые", color: "bg-blue-500" },
  { status: "assigned", label: "Назначены", color: "bg-indigo-500" },
  { status: "contacted", label: "Связались", color: "bg-cyan-500" },
  { status: "needs_follow_up", label: "Follow-up", color: "bg-amber-500" },
  { status: "qualified", label: "Квалифицированы", color: "bg-purple-500" },
  { status: "quote_sent", label: "Расчёт отправлен", color: "bg-indigo-500" },
  { status: "negotiation", label: "Переговоры", color: "bg-orange-500" },
  { status: "won", label: "Выиграны", color: "bg-green-500" },
  { status: "lost", label: "Проиграны", color: "bg-red-500" },
];

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const router = useRouter();
  const [optimisticLeads, setOptimisticLeads] = useState<KanbanLead[]>(leads);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  function handleDragStart(leadId: string, _sourceStatus: string) {
    setDraggedLeadId(leadId);
  }

  async function handleDrop(leadId: string, targetStatus: string) {
    setDraggedLeadId(null);

    // Optimistic update
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
        // Revert on failure
        setOptimisticLeads(leads);
        console.error("Failed to update lead status");
      } else {
        router.refresh();
      }
    } catch {
      setOptimisticLeads(leads);
      console.error("Failed to update lead status");
    }
  }

  function getLeadsForStatus(status: string): KanbanLead[] {
    return optimisticLeads
      .filter((lead) => lead.status === status)
      .sort((a, b) => a.statusOrder - b.statusOrder);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          label={col.label}
          color={col.color}
          leads={getLeadsForStatus(col.status)}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
