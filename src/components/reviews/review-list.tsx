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
      <p className="text-center text-muted-foreground">
        Отзывов пока нет
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
