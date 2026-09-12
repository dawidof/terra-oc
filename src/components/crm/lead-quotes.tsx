"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileDown, FileText, Loader2, Plus, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/crm/status-badge";
import { formatDate } from "@/lib/format";
import { QuoteDownload } from "@/components/pdf/quote-download";
import type { QuoteData } from "@/components/pdf/quote-document";

interface Quote {
  id: string;
  status: string;
  configurationJson: unknown;
  pdfUrl: string | null;
  validUntil: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface QuotePdfFallback {
  customer: QuoteData["customer"];
  vehicle: QuoteData["vehicle"];
  configuration?: QuoteData["configuration"];
  breakdown: QuoteData["breakdown"] | null;
}

interface LeadQuotesProps {
  leadId: string;
  initialQuotes: Quote[];
  configurationJson: unknown;
  pdfFallback?: QuotePdfFallback;
}

export function LeadQuotes({ leadId, initialQuotes, configurationJson, pdfFallback }: LeadQuotesProps) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, configurationJson: configurationJson || {} }),
      });

      if (res.ok) {
        const data = await res.json();
        setQuotes([
          {
            id: data.quote.id,
            status: data.quote.status,
            configurationJson: data.quote.configurationJson,
            pdfUrl: data.quote.pdfUrl,
            validUntil: data.quote.validUntil,
            createdAt: data.quote.createdAt,
            sentAt: data.quote.sentAt,
          },
          ...quotes,
        ]);
        toast.success("Расчёт создан");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось создать расчёт");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setCreating(false);
    }
  }

  async function handleMarkSent(quote: Quote) {
    setSendingId(quote.id);
    try {
      const res = await fetch("/api/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id, status: "sent" }),
      });

      if (res.ok) {
        setQuotes(
          quotes.map((q) =>
            q.id === quote.id
              ? { ...q, status: "sent", sentAt: new Date().toISOString() }
              : q
          )
        );
        toast.success("Расчёт отмечен отправленным");
        router.refresh();
      } else {
        toast.error("Не удалось обновить расчёт");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setSendingId(null);
    }
  }

  function copyClientLink(quote: Quote) {
    const url = `${window.location.origin}/portal?quoteId=${quote.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Ссылка на расчёт скопирована");
  }

  function buildFallbackData(quote: Quote): QuoteData | null {
    if (!pdfFallback?.breakdown) return null;
    return {
      quoteId: quote.id,
      createdAt: quote.createdAt,
      validUntil: quote.validUntil ?? quote.createdAt,
      customer: pdfFallback.customer,
      vehicle: pdfFallback.vehicle,
      configuration: pdfFallback.configuration,
      breakdown: pdfFallback.breakdown,
    };
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <FileText className="size-3.5" aria-hidden />
          Расчёты
        </p>
        <Button variant="outline" size="sm" onClick={handleCreate} disabled={creating}>
          {creating ? (
            <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
          ) : (
            <Plus data-icon="inline-start" className="size-3.5" />
          )}
          Создать расчёт
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {quotes.map((quote) => (
          <div
            key={quote.id}
            className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Расчёт #{quote.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  Создан {formatDate(quote.createdAt)}
                  {quote.validUntil && ` · действителен до ${formatDate(quote.validUntil)}`}
                  {quote.sentAt && ` · отправлен ${formatDate(quote.sentAt)}`}
                </p>
              </div>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {quote.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => handleMarkSent(quote)}
                  disabled={sendingId === quote.id}
                >
                  {sendingId === quote.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Send className="size-3" />
                  )}
                  Отметить отправленным
                </Button>
              )}
              {quote.pdfUrl ? (
                <a
                  href={quote.pdfUrl}
                  download
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <FileDown className="size-3" />
                  PDF
                </a>
              ) : buildFallbackData(quote) ? (
                <QuoteDownload data={buildFallbackData(quote)!} className="h-7 px-2 text-xs" />
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => copyClientLink(quote)}
              >
                Ссылка
              </Button>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Расчётов пока нет. Создайте расчёт — клиент увидит его в личном
            кабинете по ссылке, а вы сможете отправить её кнопкой «Ссылка».
          </p>
        )}
      </div>
    </div>
  );
}
