import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";

import { ReviewsManager } from "@/components/crm/reviews-manager";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export const metadata = {
  title: "CRM — Отзывы",
};

export default async function ReviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/crm");

  const allReviews = await db
    .select({
      id: reviews.id,
      name: reviews.name,
      city: reviews.city,
      rating: reviews.rating,
      vehicleLabel: reviews.vehicleLabel,
      text: reviews.text,
      published: reviews.published,
      featured: reviews.featured,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .orderBy(desc(reviews.createdAt));

  return <ReviewsManager reviews={allReviews} />;
}
