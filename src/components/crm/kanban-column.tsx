"use client";

import { KanbanCard } from "./kanban-card";
import { Badge } from "@/components/ui/badge";

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

interface KanbanColumnProps {
  status: string;
  label: string;
  color: string;
  leads: KanbanLead[];
  onDragStart: (leadId: string, sourceStatus: string) => void;
  onDrop: (leadId: string, targetStatus: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  assigned: "bg-indigo-500",
  contacted: "bg-cyan-500",
  needs_follow_up: "bg-amber-500",
  qualified: "bg-purple-500",
  quote_sent: "bg-indigo-500",
  negotiation: "bg-orange-500",
  won: "bg-green-500",
  lost: "bg-red-500",
};

export function KanbanColumn({
  status,
  label,
  color,
  leads,
  onDragStart,
  onDrop,
}: KanbanColumnProps) {
  const totalValue = leads.reduce(
    (sum, lead) => sum + (lead.estimatedTotalUsd ? Number(lead.estimatedTotalUsd) : 0),
    0
  );

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      onDrop(leadId, status);
    }
  }

  return (
    <div
      className="flex min-w-[280px] flex-col rounded-lg bg-gray-50 p-2"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-2 flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${color || STATUS_COLORS[status] || "bg-gray-400"}`} />
          <span className="text-sm font-medium">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {leads.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-muted-foreground">
            ${totalValue.toLocaleString("en-US")}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            Перетащите заявку сюда
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}
