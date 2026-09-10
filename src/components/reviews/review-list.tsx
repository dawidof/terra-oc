import { ReviewCard } from "./review-card";

interface Review {
  id: string;
  name: string;
  city: string | null;
  rating: number | null;
  vehicleLabel: string | null;
  text: string | null;
  imageUrl: string | null;
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-xl bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-soft">
        Отзывов пока нет
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
