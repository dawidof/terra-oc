"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";

interface Note {
  id: string;
  body: string;
  createdAt: Date;
  userName: string;
}

function formatDateTime(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Заметки</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Добавить заметку..."
            className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            rows={2}
          />
          <Button type="submit" size="sm" disabled={loading || !body.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-3">
          {localNotes.map((note) => (
            <div key={note.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium">{note.userName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(note.createdAt)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{note.body}</p>
            </div>
          ))}
          {localNotes.length === 0 && (
            <p className="text-sm text-muted-foreground">Заметок пока нет</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
