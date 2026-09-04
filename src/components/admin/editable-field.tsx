"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

interface EditableFieldProps {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  className?: string;
  placeholder?: string;
  type?: "text" | "number";
}

export function EditableField({
  value,
  onSave,
  className = "",
  placeholder = "—",
  type = "text",
}: EditableFieldProps) {
  const { isAdmin } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return <span className={className}>{value || placeholder}</span>;
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <Input
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={`h-8 w-auto min-w-[120px] ${className}`}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setEditing(false);
          }}
        />
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
    if (draft === (value || "")) {
      setEditing(false);
      return;
    }
    setLoading(true);
    try {
      await onSave(draft);
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
      {value || placeholder}
      <Pencil className="ml-1 inline h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
    </span>
  );
}
