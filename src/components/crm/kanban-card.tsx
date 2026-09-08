"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/crm/status-badge";
import { User, Clock, DollarSign } from "lucide-react";

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

interface KanbanCardProps {
  lead: KanbanLead;
  onDragStart: (leadId: string, sourceStatus: string) => void;
}

function formatPrice(price: string | null): string {
  if (!price) return "";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин`;
  if (diffHours < 24) return `${diffHours} ч`;
  return `${diffDays} д`;
}

function sourceLabel(source: string | null): string {
  switch (source) {
    case "website": return "Сайт";
    case "configurator": return "Конфигуратор";
    case "calculator": return "Калькулятор";
    case "phone": return "Телефон";
    case "telegram": return "Telegram";
    default: return source || "—";
  }
}

function sourceColor(source: string | null): string {
  switch (source) {
    case "configurator": return "bg-purple-100 text-purple-700";
    case "calculator": return "bg-blue-100 text-blue-700";
    case "phone": return "bg-green-100 text-green-700";
    case "telegram": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function KanbanCard({ lead, onDragStart }: KanbanCardProps) {
  const vehicle = lead.brandName && lead.modelName
    ? `${lead.brandName} ${lead.modelName}`
    : null;
  const trim = lead.trimName || null;

  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("leadId", lead.id);
        e.dataTransfer.setData("sourceStatus", lead.status);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(lead.id, lead.status);
      }}
      className="cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
    >
      <CardContent className="p-3">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link
            href={`/crm/leads/${lead.id}`}
            className="text-sm font-medium hover:text-emerald-600 hover:underline"
          >
            {lead.customerName}
          </Link>
          <StatusBadge status={lead.status} />
        </div>

        {vehicle && (
          <div className="mb-2 text-xs text-muted-foreground">
            🚗 {vehicle}
            {trim && <span className="ml-1">• {trim}</span>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {lead.estimatedTotalUsd && (
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatPrice(lead.estimatedTotalUsd)}
            </span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sourceColor(lead.source)}`}>
            {sourceLabel(lead.source)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(lead.createdAt)}
          </span>
          {lead.managerName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {lead.managerName}
            </span>
          )}
        </div>

        {lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) < new Date() && (
          <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
            ⏰ Нужен follow-up
          </div>
        )}
      </CardContent>
    </Card>
  );
}
