import Image from "next/image";
import { Car, MapPin, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface Review {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  vehicleLabel: string | null;
  text: string | null;
  imageUrl: string | null;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex gap-0.5" aria-label={`Оценка: ${rating} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={
            i < rating
              ? "size-4 fill-amber-400 text-amber-400"
              : "size-4 fill-transparent text-border"
          }
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="h-full gap-0 py-0 transition duration-200 hover:shadow-md hover:ring-foreground/20">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {review.name}
            </h3>
            {review.city && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" aria-hidden />
                {review.city}
              </p>
            )}
          </div>
          <StarRating rating={review.rating} />
        </div>

        {review.vehicleLabel && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand">
            <Car className="size-3.5 shrink-0" aria-hidden />
            {review.vehicleLabel}
          </p>
        )}

        {review.text && (
          <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
            «{review.text}»
          </p>
        )}

        {review.imageUrl && (
          <div className="mt-5 overflow-hidden rounded-lg">
            <Image
              src={review.imageUrl}
              alt={`Фото автомобиля ${review.vehicleLabel || review.name}`}
              width={640}
              height={360}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
