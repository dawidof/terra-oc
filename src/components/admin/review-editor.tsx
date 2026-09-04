"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

interface ReviewEditorProps {
  reviewId: string;
  data: {
    name: string;
    city: string | null;
    rating: number | null;
    vehicleLabel: string | null;
    text: string | null;
    published: boolean;
    featured: boolean;
    sortOrder: number;
  };
  onUpdate?: () => void;
}

export function ReviewEditor({ reviewId, data, onUpdate }: ReviewEditorProps) {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: data.name,
    city: data.city || "",
    rating: data.rating?.toString() || "",
    vehicleLabel: data.vehicleLabel || "",
    text: data.text || "",
    published: data.published,
    featured: data.featured,
    sortOrder: data.sortOrder.toString(),
  });
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  async function handleSave() {
    setLoading(true);
    try {
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          city: form.city || null,
          rating: form.rating ? Number(form.rating) : null,
          vehicleLabel: form.vehicleLabel || null,
          text: form.text || null,
          published: form.published,
          featured: form.featured,
          sortOrder: Number(form.sortOrder),
        }),
      });
      setOpen(false);
      onUpdate?.();
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
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">Редактировать отзыв</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Город</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Рейтинг</Label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={String(r)}>
                    {r} из 5
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Автомобиль</Label>
              <Input
                value={form.vehicleLabel}
                onChange={(e) => setForm({ ...form, vehicleLabel: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Текст отзыва</Label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="rounded"
              />
              <Label>Опубликован</Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="rounded"
              />
              <Label>Избранный</Label>
            </div>
            <div className="space-y-2">
              <Label>Порядок</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
