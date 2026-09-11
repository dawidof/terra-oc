"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const demoAccounts = [
  { label: "Админ", email: "admin@terraauto.uz", password: "admin123" },
  { label: "Менеджер", email: "manager@terraauto.uz", password: "manager123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Неверный email или пароль");
    } else {
      router.push("/crm");
      router.refresh();
    }
  }

  function copyCredentials(email: string, password: string, idx: number) {
    navigator.clipboard.writeText(`${email}\n${password}`);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <p className="flex items-center justify-center gap-2 text-2xl font-semibold tracking-[-0.03em]">
            <span className="size-2.5 rounded-full bg-brand" aria-hidden />
            TerraAuto
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Вход в CRM систему</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@terraauto.uz"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-brand text-brand-foreground shadow-sm hover:bg-brand-deep"
            disabled={loading}
          >
            {loading ? "Вход..." : "Войти"}
          </Button>
        </form>

        <div className="rounded-xl bg-muted/50 p-4 ring-1 ring-foreground/5">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Демо-данные
          </p>
          <div className="flex flex-col gap-2">
            {demoAccounts.map((acc, i) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => copyCredentials(acc.email, acc.password, i)}
                className="flex items-center justify-between rounded-lg bg-background px-3 py-2 text-left ring-1 ring-foreground/5 transition-colors hover:ring-foreground/20"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium">{acc.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {acc.email} / {acc.password}
                  </span>
                </div>
                {copiedIdx === i ? (
                  <Check className="size-3.5 shrink-0 text-green-600" />
                ) : (
                  <Copy className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
