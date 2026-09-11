import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getLeads } from "@/lib/crm";
import { getStatusStyle } from "@/components/crm/status-badge";

function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(Number(searchParams.get("pageSize")) || 10000, 10000);

  try {
    const result = await getLeads({
      status: searchParams.get("status") || undefined,
      assignedManagerId: searchParams.get("assignedManagerId") || undefined,
      source: searchParams.get("source") || undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      budgetMin: searchParams.get("budgetMin")
        ? Number(searchParams.get("budgetMin"))
        : undefined,
      budgetMax: searchParams.get("budgetMax")
        ? Number(searchParams.get("budgetMax"))
        : undefined,
      page: 1,
      pageSize,
    });

    const header = [
      "ID",
      "Создана",
      "Клиент",
      "Телефон",
      "Автомобиль",
      "Статус",
      "Менеджер",
      "Источник",
      "Сумма (USD)",
      "Звонок",
    ].join(";");

    const rows = result.leads.map((lead) =>
      [
        lead.id,
        new Date(lead.createdAt).toLocaleString("ru-RU"),
        lead.customerName,
        lead.customerPhone,
        [lead.brandName, lead.modelName, lead.trimName].filter(Boolean).join(" "),
        getStatusStyle(lead.status).label,
        lead.assignedManagerName,
        lead.source,
        lead.estimatedTotalUsd ? Number(lead.estimatedTotalUsd).toLocaleString("en-US") : "",
        lead.nextFollowUpAt
          ? new Date(lead.nextFollowUpAt).toLocaleString("ru-RU")
          : "",
      ]
        .map(csvEscape)
        .join(";")
    );

    const csv = `\uFEFF${[header, ...rows].join("\n")}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="terraauto-leads.csv"`,
      },
    });
  } catch (error) {
    console.error("Leads export error:", error);
    return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
  }
}
