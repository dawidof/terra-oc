"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

interface Note {
  id: string;
  body: string;
  createdAt: Date;
  userName: string;
}

export function LeadNotes({
  leadId,
  notes,
}: {
  leadId: string;
  notes: Note[];
}) {
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [localNotes, setLocalNotes] = useState(notes);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setLocalNotes([
          {
            id: data.note.id,
            body: body.trim(),
            createdAt: new Date(),
            userName: "Вы",
          },
          ...localNotes,
        ]);
        setBody("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Заметки
      </p>

      <form onSubmit={handleAdd} className="flex gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Добавить заметку..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          rows={2}
        />
        <Button type="submit" size="icon" disabled={loading || !body.trim()}>
          <Send className="size-4" />
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {localNotes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium">{note.userName}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(note.createdAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{note.body}</p>
          </div>
        ))}
        {localNotes.length === 0 && (
          <p className="text-sm text-muted-foreground">Заметок пока нет</p>
        )}
      </div>
    </div>
  );
}
