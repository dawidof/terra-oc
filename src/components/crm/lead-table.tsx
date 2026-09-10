"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatUsd } from "@/lib/format";

import { StatusBadge } from "./status-badge";

interface Lead {
  id: string;
  status: string;
  source: string | null;
  estimatedTotalUsd: string | null;
  createdAt: Date;
  nextFollowUpAt: Date | null;
  customerName: string;
  customerPhone: string | null;
  assignedManagerName: string | null;
  brandName: string | null;
  modelName: string | null;
  trimName: string | null;
}

function vehicleLabel(lead: Lead): string {
  if (lead.brandName && lead.modelName) {
    return `${lead.brandName} ${lead.modelName}${lead.trimName ? ` ${lead.trimName}` : ""}`;
  }
  return "—";
}

function followUpStatus(date: Date | null): { label: string; className: string } | null {
  if (!date) return null;
  const followUp = new Date(date);
  const diffDays = Math.ceil((followUp.getTime() - Date.now()) / 86400000);

  if (diffDays < 0) return { label: "Просрочено", className: "text-red-600" };
  if (diffDays === 0) return { label: "Сегодня", className: "text-amber-600" };
  if (diffDays <= 3)
    return { label: `через ${diffDays} дн.`, className: "text-brand" };
  return { label: formatDate(followUp), className: "text-muted-foreground" };
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
        <p className="text-sm text-muted-foreground">Заявки не найдены</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Клиент</TableHead>
            <TableHead>Телефон</TableHead>
            <TableHead>Автомобиль</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Менеджер</TableHead>
            <TableHead>Создана</TableHead>
            <TableHead>Звонок</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const followUp = followUpStatus(lead.nextFollowUpAt);
            return (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.customerName}</TableCell>
                <TableCell>
                  {lead.customerPhone ? (
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      {lead.customerPhone}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  {vehicleLabel(lead)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                  {lead.estimatedTotalUsd ? formatUsd(lead.estimatedTotalUsd) : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell>{lead.assignedManagerName || "—"}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDate(lead.createdAt)}
                </TableCell>
                <TableCell>
                  {followUp ? (
                    <span
                      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${followUp.className}`}
                    >
                      <Clock className="size-3.5" aria-hidden />
                      {followUp.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Открыть заявку ${lead.customerName}`}
                    render={<Link href={`/crm/leads/${lead.id}`} />}
                    nativeButton={false}
                  >
                    <ArrowUpRight className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
