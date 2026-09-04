"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

interface EditableTextareaProps {
  value: string | null;
  label: string;
  onSave: (value: string) => Promise<void>;
}

export function EditableTextarea({
  value,
  label,
  onSave,
}: EditableTextareaProps) {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return value ? <p className="whitespace-pre-wrap text-sm">{value}</p> : null;
  }

  async function handleSave() {
    if (draft === (value || "")) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      await onSave(draft);
      setOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setOpen(true)}>
        <Pencil className="h-3 w-3" />
        Редактировать
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">{label}</h3>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[300px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
