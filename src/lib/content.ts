import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { reviews, contentPages, siteSettings } from "@/db/schema";

export async function getPublishedReviews(featuredOnly = false) {
  const conditions = [eq(reviews.published, true)];
  if (featuredOnly) {
    conditions.push(eq(reviews.featured, true));
  }

  return db
    .select()
    .from(reviews)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(reviews.sortOrder, desc(reviews.createdAt));
}

export async function getContentPage(slug: string) {
  const [page] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.slug, slug))
    .limit(1);

  return page || null;
}

export async function getSiteSetting(key: string) {
  const [setting] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);

  return setting?.valueJson || null;
}
