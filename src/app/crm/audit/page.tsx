import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuditFilters } from "@/components/crm/audit-filters";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/lib/auth";
import { getAuditEntityTypes, getAuditLogs } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "CRM — Аудит",
};

const PAGE_SIZE = 30;

const entityLabels: Record<string, string> = {
  user: "Пользователи",
  lead: "Заявки",
  review: "Отзывы",
  site_settings: "Настройки",
  trim: "Комплектации",
  offer: "Предложения",
};

function JsonDiff({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <pre className="max-w-[240px] truncate font-mono text-xs text-muted-foreground">
      {JSON.stringify(value)}
    </pre>
  );
}

async function AuditContent({
  entityType,
  page,
}: {
  entityType?: string;
  page: number;
}) {
  const { logs, total } = await getAuditLogs({
    entityType,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pageHref = (next: number) =>
    `/crm/audit?${new URLSearchParams({
      ...(entityType ? { entityType } : {}),
      page: String(next),
    }).toString()}`;

  return (
    <>
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Дата</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Действие</TableHead>
              <TableHead>Было</TableHead>
              <TableHead>Стало</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                  Записей не найдено
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.userName || "—"}
                  </TableCell>
                  <TableCell>
                    {entityLabels[log.entityType] || log.entityType}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.entityId.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.action}
                  </TableCell>
                  <TableCell>
                    <JsonDiff value={log.beforeJson} />
                  </TableCell>
                  <TableCell>
                    <JsonDiff value={log.afterJson} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Страница {page} из {totalPages} · всего {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" render={<Link href={pageHref(page - 1)} />} nativeButton={false}>
                Назад
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" render={<Link href={pageHref(page + 1)} />} nativeButton={false}>
                Далее
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ entityType?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/crm");

  const params = await searchParams;
  const entityType = params?.entityType || undefined;
  const page = Math.max(1, Number(params?.page) || 1);
  const entityTypes = await getAuditEntityTypes();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Аудит</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Журнал изменений в системе
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-8 w-48" />}>
          <AuditFilters entityTypes={entityTypes} />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <AuditContent entityType={entityType} page={page} />
      </Suspense>
    </div>
  );
}
