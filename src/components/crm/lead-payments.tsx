"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Plus, Trash2, Wallet, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd, formatDate } from "@/lib/format";

interface Payment {
  id: string;
  label: string;
  amount: string;
  currency: string;
  dueDate: string | null;
  paidAt: string | null;
  sortOrder: number;
}

interface LeadPaymentsProps {
  leadId: string;
  initialPayments: Payment[];
}

export function LeadPayments({ leadId, initialPayments }: LeadPaymentsProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paidTotal = payments
    .filter((p) => p.paidAt)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = total - paidTotal;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !amount) {
      toast.error("Укажите название и сумму");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          amount: Number(amount),
          dueDate: dueDate || null,
          paid: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPayments([...payments, data.payment]);
        setLabel("");
        setAmount("");
        setDueDate("");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось добавить платёж");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setAdding(false);
    }
  }

  async function handleTogglePaid(payment: Payment) {
    setBusyId(payment.id);
    try {
      const res = await fetch(`/api/leads/${leadId}/payments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id, paid: !payment.paidAt }),
      });

      if (res.ok) {
        const data = await res.json();
        setPayments(payments.map((p) => (p.id === payment.id ? data.payment : p)));
        router.refresh();
      } else {
        toast.error("Не удалось обновить платёж");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(paymentId: string) {
    setBusyId(paymentId);
    try {
      const res = await fetch(
        `/api/leads/${leadId}/payments?paymentId=${paymentId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setPayments(payments.filter((p) => p.id !== paymentId));
        router.refresh();
      } else {
        toast.error("Не удалось удалить платёж");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Wallet className="size-3.5" aria-hidden />
          График оплаты
        </p>
        {payments.length > 0 && (
          <div className="text-right text-xs">
            <span className="text-muted-foreground">Остаток: </span>
            <span className="font-semibold">{formatUsd(String(balance))}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
          >
            <button
              type="button"
              onClick={() => handleTogglePaid(payment)}
              disabled={busyId === payment.id}
              className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                payment.paidAt
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-border text-transparent hover:border-green-600"
              }`}
              title={payment.paidAt ? "Отметить неоплаченным" : "Отметить оплаченным"}
            >
              {busyId === payment.id ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`truncate text-sm ${payment.paidAt ? "text-muted-foreground line-through" : "font-medium"}`}>
                {payment.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {payment.paidAt
                  ? `Оплачено ${formatDate(payment.paidAt)}`
                  : payment.dueDate
                    ? `Срок: ${formatDate(payment.dueDate)}`
                    : "Срок не указан"}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold">
              {formatUsd(payment.amount)}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(payment.id)}
              disabled={busyId === payment.id}
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
              title="Удалить"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {payments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Платежей пока нет. Добавьте график — клиент увидит его в личном кабинете.
          </p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Например: Предоплата по договору"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="$"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <DatePicker
              value={dueDate}
              onChange={setDueDate}
              placeholder="Срок оплаты"
            />
          </div>
          <Button type="submit" disabled={adding || !label.trim() || !amount}>
            {adding ? (
              <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
            ) : (
              <Plus data-icon="inline-start" className="size-4" />
            )}
            Добавить
          </Button>
        </div>
      </form>
    </div>
  );
}
