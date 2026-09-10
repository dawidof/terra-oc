"use client";

import Link from "next/link";
import { Car, Clock, DollarSign, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeTime, formatUsd } from "@/lib/format";

import type { KanbanLead } from "./kanban-board";
import { SourceTag } from "./lead-source";
import { StatusBadge } from "./status-badge";

interface KanbanCardProps {
  lead: KanbanLead;
  onDragStart: (leadId: string, sourceStatus: string) => void;
}

export function KanbanCard({ lead, onDragStart }: KanbanCardProps) {
  const vehicle =
    lead.brandName && lead.modelName
      ? `${lead.brandName} ${lead.modelName}`
      : null;

  const isOverdue =
    lead.nextFollowUpAt !== null && new Date(lead.nextFollowUpAt) < new Date();

  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("leadId", lead.id);
        e.dataTransfer.setData("sourceStatus", lead.status);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(lead.id, lead.status);
      }}
      className="gap-0 bg-card py-0 shadow-sm ring-foreground/10 transition duration-150 hover:shadow-md active:cursor-grabbing"
      style={{ cursor: "grab" }}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/crm/leads/${lead.id}`}
            className="truncate text-sm font-medium transition-colors hover:text-brand"
          >
            {lead.customerName}
          </Link>
          <StatusBadge status={lead.status} />
        </div>

        {vehicle && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Car className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {vehicle}
              {lead.trimName ? ` · ${lead.trimName}` : ""}
            </span>
          </p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {lead.estimatedTotalUsd && (
            <span className="inline-flex items-center gap-1 font-medium tabular-nums text-foreground">
              <DollarSign className="size-3.5" aria-hidden />
              {formatUsd(lead.estimatedTotalUsd)}
            </span>
          )}
          <SourceTag source={lead.source} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {formatRelativeTime(lead.createdAt)}
          </span>
          {lead.managerName && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <User className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{lead.managerName}</span>
            </span>
          )}
        </div>

        {isOverdue && (
          <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
            Нужен follow-up
          </p>
        )}
      </CardContent>
    </Card>
  );
}
