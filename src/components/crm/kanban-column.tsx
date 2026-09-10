"use client";

import { Badge } from "@/components/ui/badge";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { KanbanCard } from "./kanban-card";
import type { KanbanLead } from "./kanban-board";
import { StatusDot } from "./status-badge";

interface KanbanColumnProps {
  status: string;
  label: string;
  leads: KanbanLead[];
  isDragActive?: boolean;
  onDragStart: (leadId: string, sourceStatus: string) => void;
  onDrop: (leadId: string, targetStatus: string) => void;
}

export function KanbanColumn({
  status,
  label,
  leads,
  isDragActive = false,
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
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-xl bg-muted/60 p-2 ring-1 ring-transparent transition",
        isDragActive && "ring-foreground/10"
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-2 flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot status={status} />
          <span className="truncate text-sm font-medium">{label}</span>
          <Badge variant="secondary" className="bg-background text-muted-foreground">
            {leads.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatUsd(totalValue)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {leads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Перетащите заявку сюда
          </div>
        ) : (
          leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
}
