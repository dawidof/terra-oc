import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Car } from "lucide-react";

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
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{review.name}</h3>
            {review.city && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {review.city}
              </p>
            )}
          </div>
          <StarRating rating={review.rating} />
        </div>

        {review.vehicleLabel && (
          <p className="mb-2 flex items-center gap-1 text-sm text-emerald-600">
            <Car className="h-3 w-3" />
            {review.vehicleLabel}
          </p>
        )}

        {review.text && (
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            "{review.text}"
          </p>
        )}

        {review.imageUrl && (
          <div className="mt-4">
            <img
              src={review.imageUrl}
              alt={review.name}
              className="h-32 w-full rounded-lg object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
