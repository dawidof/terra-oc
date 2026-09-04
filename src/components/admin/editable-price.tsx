"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

interface EditablePriceProps {
  value: string | null;
  currency?: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
}

export function EditablePrice({
  value,
  currency = "USD",
  onSave,
  className = "",
}: EditablePriceProps) {
  const { isAdmin } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAdmin) {
    return (
      <span className={className}>
        {value ? `$${Number(value).toLocaleString("en-US")}` : "—"}
      </span>
    );
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="text-sm">$</span>
        <Input
          type="number"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          className={`h-8 w-28 ${error ? "border-red-500" : ""}`}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={loading}>
          <Check className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          <X className="h-3 w-3" />
        </Button>
      </span>
    );
  }

  async function handleSave() {
    const num = Number(draft);
    if (!draft || isNaN(num) || num < 0) {
      setError("Введите корректную цену");
      return;
    }
    if (draft === value) {
      setEditing(false);
      return;
    }
    setLoading(true);
    try {
      await onSave(String(num));
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <span
      className={`group cursor-pointer rounded px-1 -mx-1 hover:bg-emerald-50 ${className}`}
      onClick={() => setEditing(true)}
    >
      {value ? `$${Number(value).toLocaleString("en-US")}` : "—"}
      <Pencil className="ml-1 inline h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </span>
  );
}
