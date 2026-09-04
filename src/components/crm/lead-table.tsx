"use client";

import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Phone, MessageSquare, Clock } from "lucide-react";

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

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatPrice(price: string | null): string {
  if (!price) return "—";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function vehicleLabel(lead: Lead): string {
  if (lead.brandName && lead.modelName) {
    return `${lead.brandName} ${lead.modelName}${lead.trimName ? ` ${lead.trimName}` : ""}`;
  }
  return "—";
}

function followUpStatus(date: Date | null): { label: string; color: string } | null {
  if (!date) return null;
  const now = new Date();
  const followUp = new Date(date);
  const diffDays = Math.ceil((followUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Просрочено", color: "text-red-600" };
  if (diffDays === 0) return { label: "Сегодня", color: "text-amber-600" };
  if (diffDays <= 3) return { label: `через ${diffDays} дн.`, color: "text-green-600" };
  return { label: formatDate(date), color: "text-muted-foreground" };
}

export function LeadTable({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-muted-foreground">Заявки не найдены</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Клиент</TableHead>
            <TableHead>Телефон</TableHead>
            <TableHead>Автомобиль</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Менеджер</TableHead>
            <TableHead>Создана</TableHead>
            <TableHead>Звонок</TableHead>
            <TableHead />
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
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {lead.customerPhone}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{vehicleLabel(lead)}</TableCell>
                <TableCell>{formatPrice(lead.estimatedTotalUsd)}</TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell>{lead.assignedManagerName || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(lead.createdAt)}
                </TableCell>
                <TableCell>
                  {followUp ? (
                    <span className={`flex items-center gap-1 text-sm ${followUp.color}`}>
                      <Clock className="h-3 w-3" />
                      {followUp.label}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/crm/leads/${lead.id}`}>
                    <Button variant="ghost" size="sm">
                      Открыть
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
