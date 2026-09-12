"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUsd } from "@/lib/format";

interface UtmRow {
  name: string;
  total: number;
  won: number;
  revenue: number;
}

function AttributionTable({ rows }: { rows: UtmRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Источник</TableHead>
          <TableHead className="text-right">Заявки</TableHead>
          <TableHead className="text-right">Продажи</TableHead>
          <TableHead className="text-right">CR</TableHead>
          <TableHead className="text-right">Выручка</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell className="max-w-[160px] truncate font-medium">
              {row.name}
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.total}</TableCell>
            <TableCell className="text-right tabular-nums">{row.won}</TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {row.total > 0 ? `${Math.round((row.won / row.total) * 100)}%` : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {row.revenue > 0 ? formatUsd(Math.round(row.revenue)) : "—"}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-sm text-muted-foreground">
              Нет данных за период
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

interface UtmTablesCardProps {
  campaigns: UtmRow[];
  referrerHosts: UtmRow[];
}

export function UtmTablesCard({ campaigns, referrerHosts }: UtmTablesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Атрибуция трафика</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="campaigns">
          <TabsList className="mb-3">
            <TabsTrigger value="campaigns">Кампании</TabsTrigger>
            <TabsTrigger value="referrers">Сайты-источники</TabsTrigger>
          </TabsList>
          <TabsContent value="campaigns">
            <AttributionTable rows={campaigns} />
          </TabsContent>
          <TabsContent value="referrers">
            <AttributionTable rows={referrerHosts} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
