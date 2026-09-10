"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, X, Star } from "lucide-react";

import { Section, Heading, Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  vehicleLabel: string | null;
  text: string | null;
  imageUrls: string[];
  createdAt: Date | string | null;
  avatarUrl: string | null;
}

const ratingBadges = [
  { platform: "2ГИС", rating: "5.0" },
  { platform: "ВКонтакте", rating: "5.0" },
  { platform: "Яндекс", rating: "5.0" },
];

function StarRating({ rating, size = "sm" }: { rating: number | null; size?: "sm" | "lg" }) {
  if (!rating) return null;
  const sizeClass = size === "lg" ? "size-5" : "size-3.5";
  return (
    <div className="flex items-center gap-1.5" aria-label={`Оценка: ${rating} из 5`}>
      <span className={cn("font-semibold", size === "lg" ? "text-base" : "text-sm")}>
        {rating.toFixed(1)}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            aria-hidden
            className={cn(
              sizeClass,
              i < rating
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewModal({
  review,
  onClose,
}: {
  review: Review;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-muted p-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          aria-label="Закрыть"
        >
          <X className="size-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3">
            {review.avatarUrl ? (
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={review.avatarUrl}
                  alt={review.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                {review.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold">{review.name}</h3>
              {review.city && (
                <p className="text-xs text-muted-foreground">{review.city}</p>
              )}
            </div>
            <div className="ml-auto">
              <StarRating rating={review.rating} size="lg" />
            </div>
          </div>

          {review.vehicleLabel && (
            <p className="mt-3 text-sm font-medium text-brand">
              {review.vehicleLabel}
            </p>
          )}

          {review.text && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {review.text}
            </p>
          )}

          {review.imageUrls.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              {review.imageUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
                >
                  <Image
                    src={url}
                    alt={`Фото ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 40vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function HomeReviews({ reviews }: { reviews: Review[] }) {
  const [modalReview, setModalReview] = useState<Review | null>(null);

  return (
    <Section id="reviews" divide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Отзывы</Eyebrow>
          <Heading size="lg" className="mt-3">
            Отзывы клиентов
          </Heading>
        </div>
        <Link
          href="/reviews"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand"
        >
          Все отзывы
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {ratingBadges.map((badge) => (
          <div
            key={badge.platform}
            className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5"
          >
            <span className="text-sm font-medium">{badge.platform}</span>
            <div className="flex items-center gap-1">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">{badge.rating}</span>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-10 rounded-xl bg-muted px-6 py-10 text-center text-sm text-muted-foreground">
          Отзывов пока нет
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col overflow-hidden rounded-xl bg-card shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <div className="p-5">
                <div className="flex items-center gap-3">
                  {review.avatarUrl ? (
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={review.avatarUrl}
                        alt={review.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                      {review.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold tracking-tight">
                      {review.name}
                    </h3>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.createdAt && (
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })}
                    </time>
                  )}
                </div>
              </div>

              <div className="border-t border-border px-5 py-4">
                {review.vehicleLabel && (
                  <p className="mb-2 text-xs font-medium text-brand">
                    {review.vehicleLabel}
                  </p>
                )}
                {review.text && (
                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                    {review.text}
                  </p>
                )}
              </div>

              {review.imageUrls.length > 0 && (
                <div className="border-t border-border px-5 py-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {review.imageUrls.slice(0, 3).map((url, i) => (
                      <div
                        key={i}
                        className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted"
                      >
                        <Image
                          src={url}
                          alt={`Фото ${i + 1}`}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-border px-5 py-3">
                <button
                  type="button"
                  onClick={() => setModalReview(review)}
                  className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand"
                >
                  Читать далее
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalReview && (
        <ReviewModal review={modalReview} onClose={() => setModalReview(null)} />
      )}
    </Section>
  );
}
