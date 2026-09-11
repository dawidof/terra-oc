"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

interface ReviewRow {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  vehicleLabel: string | null;
  text: string | null;
  published: boolean;
  featured: boolean;
  createdAt: Date | string;
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function ReviewsManager({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function toggle(review: ReviewRow, field: "published" | "featured") {
    setPendingId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !review[field] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось обновить отзыв");
      toast.success(
        field === "published"
          ? review.published
            ? "Отзыв снят с публикации"
            : "Отзыв опубликован"
          : review.featured
            ? "Отзыв убран из избранного"
            : "Отзыв добавлен в избранное"
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setPendingId(null);
    }
  }

  const publishedCount = reviews.filter((r) => r.published).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Отзывы</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Всего {reviews.length} · опубликовано {publishedCount}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl bg-card px-6 py-12 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">Отзывов пока нет</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Автор</TableHead>
                <TableHead>Автомобиль</TableHead>
                <TableHead className="min-w-[280px]">Отзыв</TableHead>
                <TableHead>Оценка</TableHead>
                <TableHead>Опубликован</TableHead>
                <TableHead>Избранный</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow
                  key={review.id}
                  className={ !review.published ? "opacity-70" : undefined}
                >
                  <TableCell>
                    <div className="font-medium">{review.name}</div>
                    {review.city && (
                      <div className="text-xs text-muted-foreground">{review.city}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {review.vehicleLabel || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {review.text || "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Stars rating={review.rating} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={review.published}
                        disabled={pendingId === review.id}
                        onCheckedChange={() => toggle(review, "published")}
                        aria-label={`Опубликовать отзыв ${review.name}`}
                      />
                      {review.published && (
                        <Badge className="bg-emerald-50 text-emerald-700">Да</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={review.featured}
                      disabled={pendingId === review.id}
                      onCheckedChange={() => toggle(review, "featured")}
                      aria-label={`Отметить отзыв ${review.name} как избранный`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(review.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Опубликованные отзывы отображаются на сайте, избранные — в блоке рекомендаций
      </p>
    </div>
  );
}
